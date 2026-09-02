const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: process.env.SERVER_ENV_FILE || '.env' });

const requiredConfig = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'APP_SECRET'];
const missingConfig = requiredConfig.filter((key) => !process.env[key]);
if (missingConfig.length > 0) {
  throw new Error(`Missing server configuration: ${missingConfig.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4',
});
const uploadDirectory = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  });
  response.end(JSON.stringify(payload));
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createToken(username, role) {
  const payload = base64UrlEncode(JSON.stringify({ username, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }));
  const signature = crypto.createHmac('sha256', process.env.APP_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function requireAuth(request) {
  const header = request.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401);

  const [payload, signature] = match[1].split('.');
  if (!payload || !signature) throw new ApiError('โทเค็นไม่ถูกต้อง', 401);
  const expected = crypto.createHmac('sha256', process.env.APP_SECRET).update(payload).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new ApiError('โทเค็นไม่ถูกต้อง', 401);
  }
  const decoded = JSON.parse(base64UrlDecode(payload));
  if (!decoded.username || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
  }
  return { username: decoded.username, role: decoded.role === 'admin' ? 'admin' : 'user' };
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) throw new ApiError('ข้อมูลมีขนาดใหญ่เกินไป', 413);
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError('ข้อมูลที่ส่งมาไม่ถูกต้อง');
  }
}

function passwordMatches(password, storedPassword) {
  if (storedPassword.startsWith('scrypt$')) {
    const [, salt, storedHash] = storedPassword.split('$');
    const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return storedHash.length === actualHash.length && crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(actualHash));
  }
  // Legacy records in the original PHP project store plaintext passwords.
  return storedPassword.length === password.length && crypto.timingSafeEqual(Buffer.from(storedPassword), Buffer.from(password));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function userResponse(username, role) {
  return { id: username, username, email: username, role: role === 'admin' ? 'admin' : 'user' };
}

async function requireAdmin(actor) {
  const [rows] = await pool.execute('SELECT role FROM user_pro WHERE user_name = ? LIMIT 1', [actor.username]);
  if (rows.length === 0 || rows[0].role !== 'admin') {
    throw new ApiError('เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการเมนูได้', 403);
  }
}

function validateProduct(input) {
  const name = String(input.name || '').trim();
  const category = String(input.category || 'ทั่วไป').trim() || 'ทั่วไป';
  const price = Number(input.price || 0);
  if (!name || !Number.isFinite(price) || price <= 0) throw new ApiError('กรุณากรอกชื่อเมนูและราคาที่ถูกต้อง');
  return {
    name,
    category,
    price,
    imageUrl: String(input.imageUrl || '').trim(),
    description: String(input.description || '').trim(),
    available: input.available === undefined ? true : Boolean(input.available),
  };
}

function productResponse(row) {
  return {
    id: String(row.id),
    name: String(row.productname || ''),
    category: String(row.colors || 'ทั่วไป'),
    price: Number(row.price || 0),
    description: String(row.description || ''),
    imageUrl: String(row.img || ''),
    available: Boolean(row.available),
  };
}

async function findProduct(id) {
  const [rows] = await pool.execute('SELECT id, productname, colors, price, img, description, available FROM Product WHERE id = ? LIMIT 1', [id]);
  if (rows.length === 0) throw new ApiError('ไม่พบเมนูที่ต้องการ', 404);
  return productResponse(rows[0]);
}

async function handleApi(request, response, url) {
  const action = url.searchParams.get('action') || 'products';

  if (action === 'login' && request.method === 'POST') {
    const body = await readJson(request);
    const username = String(body.username || body.email || '').trim();
    const password = String(body.password || '');
    if (!username || !password) throw new ApiError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    const [rows] = await pool.execute('SELECT user_name, user_password, role FROM user_pro WHERE user_name = ? LIMIT 1', [username]);
    if (rows.length === 0 || !passwordMatches(password, String(rows[0].user_password))) {
      throw new ApiError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }
    const role = rows[0].role === 'admin' ? 'admin' : 'user';
    return sendJson(response, 200, { data: { user: userResponse(username, role), token: createToken(username, role) } });
  }

  if (action === 'signup' && request.method === 'POST') {
    const body = await readJson(request);
    const username = String(body.username || body.email || '').trim();
    const password = String(body.password || '');
    if (!username || password.length < 6) throw new ApiError('ชื่อผู้ใช้ต้องไม่ว่าง และรหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    try {
      await pool.execute('INSERT INTO user_pro (user_name, user_password, role) VALUES (?, ?, ?)', [username, hashPassword(password), 'user']);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new ApiError('ชื่อผู้ใช้นี้มีอยู่แล้ว', 409);
      throw error;
    }
    return sendJson(response, 201, { data: { user: userResponse(username, 'user'), token: createToken(username, 'user') } });
  }

  const actor = requireAuth(request);

  if (action === 'upload-image' && request.method === 'POST') {
    await requireAdmin(actor);
    const body = await readJson(request);
    const mimeType = String(body.mimeType || '').toLowerCase();
    const extensionByMime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensionByMime[mimeType];
    const imageData = String(body.imageData || '');
    if (!extension || !/^[a-z0-9+/=]+$/i.test(imageData)) throw new ApiError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    const imageBuffer = Buffer.from(imageData, 'base64');
    if (imageBuffer.length === 0 || imageBuffer.length > 5 * 1024 * 1024) throw new ApiError('รูปต้องมีขนาดไม่เกิน 5 MB');
    const fileName = `product-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
    fs.writeFileSync(path.join(uploadDirectory, fileName), imageBuffer);
    const origin = `http://${request.headers.host || 'localhost:3011'}`;
    return sendJson(response, 201, { data: { url: `${origin}/uploads/${fileName}` } });
  }

  if (action === 'me' && request.method === 'GET') {
    const [rows] = await pool.execute('SELECT user_name, role FROM user_pro WHERE user_name = ? LIMIT 1', [actor.username]);
    if (rows.length === 0) throw new ApiError('ไม่พบบัญชีผู้ใช้งาน', 401);
    const role = rows[0].role === 'admin' ? 'admin' : 'user';
    return sendJson(response, 200, { data: userResponse(actor.username, role) });
  }

  if (action === 'products' && request.method === 'GET') {
    const [rows] = await pool.query('SELECT id, productname, colors, price, img, description, available FROM Product ORDER BY id DESC');
    return sendJson(response, 200, { data: rows.map(productResponse) });
  }

  if (action === 'create-product' && request.method === 'POST') {
    await requireAdmin(actor);
    const product = validateProduct(await readJson(request));
    const [result] = await pool.execute('INSERT INTO Product (productname, colors, price, img, description, available) VALUES (?, ?, ?, ?, ?, ?)', [product.name, product.category, product.price, product.imageUrl, product.description, product.available ? 1 : 0]);
    return sendJson(response, 201, { data: await findProduct(result.insertId) });
  }

  if (action === 'update-product' && request.method === 'POST') {
    await requireAdmin(actor);
    const body = await readJson(request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError('รหัสเมนูไม่ถูกต้อง');
    const product = validateProduct(body);
    await pool.execute('UPDATE Product SET productname = ?, colors = ?, price = ?, img = ?, description = ?, available = ? WHERE id = ?', [product.name, product.category, product.price, product.imageUrl, product.description, product.available ? 1 : 0, id]);
    return sendJson(response, 200, { data: await findProduct(id) });
  }

  if (action === 'delete-product' && request.method === 'DELETE') {
    await requireAdmin(actor);
    const id = Number(url.searchParams.get('id'));
    if (!Number.isInteger(id) || id < 1) throw new ApiError('รหัสเมนูไม่ถูกต้อง');
    const [result] = await pool.execute('DELETE FROM Product WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError('ไม่พบเมนูที่ต้องการลบ', 404);
    return sendJson(response, 200, { data: { id: String(id) } });
  }

  throw new ApiError('ไม่พบคำสั่ง API นี้', 404);
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    });
    return response.end();
  }

  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/health') return sendJson(response, 200, { ok: true });
  if (url.pathname.startsWith('/uploads/')) {
    const fileName = path.basename(url.pathname);
    const filePath = path.join(uploadDirectory, fileName);
    if (!fs.existsSync(filePath)) return sendJson(response, 404, { error: 'ไม่พบรูปภาพ' });
    const contentType = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[path.extname(fileName)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' });
    return fs.createReadStream(filePath).pipe(response);
  }
  if (url.pathname !== '/api.php') return sendJson(response, 404, { error: 'ไม่พบเส้นทางนี้' });

  try {
    await handleApi(request, response, url);
  } catch (error) {
    if (error instanceof ApiError) return sendJson(response, error.status, { error: error.message });
    console.error(error.message);
    return sendJson(response, 500, { error: 'เซิร์ฟเวอร์หรือฐานข้อมูลขัดข้อง' });
  }
});

const port = Number(process.env.PORT || 3011);
server.listen(port, '0.0.0.0', () => {
  console.log(`MenuPilot API listening on port ${port}`);
});
