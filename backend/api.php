<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        throw new RuntimeException('ยังไม่ได้สร้าง backend/config.php บนเซิร์ฟเวอร์');
    }

    /** @var array<string, string> $config */
    $config = require $configPath;
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']),
        $config['db_user'],
        $config['db_pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $action = $_GET['action'] ?? 'products';
    $method = $_SERVER['REQUEST_METHOD'];

    if ($action === 'login' && $method === 'POST') {
        login($pdo, $config);
    }

    if ($action === 'signup' && $method === 'POST') {
        signup($pdo, $config);
    }

    $actor = requireAuth($config);

    if ($action === 'products' && $method === 'GET') {
        $rows = $pdo->query('SELECT id, productname, colors, price, img, description, available FROM Product ORDER BY id DESC')->fetchAll();
        respond(['data' => array_map('productResponse', $rows)]);
    }

    if ($action === 'create-product' && $method === 'POST') {
        requireAdmin($actor);
        $input = requestBody();
        $product = validateProduct($input);
        $statement = $pdo->prepare('INSERT INTO Product (productname, colors, price, img, description, available) VALUES (?, ?, ?, ?, ?, ?)');
        $statement->execute([$product['name'], $product['category'], $product['price'], $product['imageUrl'], $product['description'], $product['available'] ? 1 : 0]);
        respond(['data' => findProduct($pdo, (int) $pdo->lastInsertId())], 201);
    }

    if ($action === 'update-product' && $method === 'POST') {
        requireAdmin($actor);
        $input = requestBody();
        $id = positiveInt($input['id'] ?? null, 'รหัสเมนูไม่ถูกต้อง');
        $product = validateProduct($input);
        $statement = $pdo->prepare('UPDATE Product SET productname = ?, colors = ?, price = ?, img = ?, description = ?, available = ? WHERE id = ?');
        $statement->execute([$product['name'], $product['category'], $product['price'], $product['imageUrl'], $product['description'], $product['available'] ? 1 : 0, $id]);
        if ($statement->rowCount() === 0 && !findProduct($pdo, $id)) {
            throw new ApiException('ไม่พบเมนูที่ต้องการแก้ไข', 404);
        }
        respond(['data' => findProduct($pdo, $id)]);
    }

    if ($action === 'delete-product' && $method === 'DELETE') {
        requireAdmin($actor);
        $id = positiveInt($_GET['id'] ?? null, 'รหัสเมนูไม่ถูกต้อง');
        $statement = $pdo->prepare('DELETE FROM Product WHERE id = ?');
        $statement->execute([$id]);
        if ($statement->rowCount() === 0) {
            throw new ApiException('ไม่พบเมนูที่ต้องการลบ', 404);
        }
        respond(['data' => ['id' => $id]]);
    }

    throw new ApiException('ไม่พบคำสั่ง API นี้', 404);
} catch (ApiException $error) {
    respond(['error' => $error->getMessage()], $error->statusCode);
} catch (Throwable $error) {
    error_log($error->getMessage());
    respond(['error' => 'เซิร์ฟเวอร์หรือฐานข้อมูลขัดข้อง'], 500);
}

final class ApiException extends RuntimeException
{
    public function __construct(string $message, public readonly int $statusCode = 400)
    {
        parent::__construct($message);
    }
}

/** @param array<string, string> $config */
function login(PDO $pdo, array $config): never
{
    $body = requestBody();
    $username = trim((string) ($body['username'] ?? $body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if ($username === '' || $password === '') {
        throw new ApiException('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    }

    $statement = $pdo->prepare('SELECT user_name, user_password, role FROM user_pro WHERE user_name = ? LIMIT 1');
    $statement->execute([$username]);
    $user = $statement->fetch();
    if (!$user || !passwordMatches($password, (string) $user['user_password'])) {
        throw new ApiException('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
    }

    $role = ($user['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
    respond(['data' => ['user' => userResponse((string) $user['user_name'], $role), 'token' => createToken((string) $user['user_name'], $role, $config['app_secret'])]]);
}

/** @param array<string, string> $config */
function signup(PDO $pdo, array $config): never
{
    $body = requestBody();
    $username = trim((string) ($body['username'] ?? $body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if ($username === '' || strlen($password) < 6) {
        throw new ApiException('ชื่อผู้ใช้ต้องไม่ว่าง และรหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    try {
        $statement = $pdo->prepare('INSERT INTO user_pro (user_name, user_password) VALUES (?, ?)');
        $statement->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
    } catch (PDOException $error) {
        if ((int) $error->errorInfo[1] === 1062) {
            throw new ApiException('ชื่อผู้ใช้นี้มีอยู่แล้ว', 409);
        }
        throw $error;
    }

    respond(['data' => ['user' => userResponse($username, 'user'), 'token' => createToken($username, 'user', $config['app_secret'])]], 201);
}

/** @param array<string, string> $config */
function requireAuth(array $config): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        throw new ApiException('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401);
    }

    $parts = explode('.', $matches[1], 2);
    if (count($parts) !== 2) {
        throw new ApiException('โทเค็นไม่ถูกต้อง', 401);
    }
    [$payload, $signature] = $parts;
    $expected = hash_hmac('sha256', $payload, $config['app_secret']);
    if (!hash_equals($expected, $signature)) {
        throw new ApiException('โทเค็นไม่ถูกต้อง', 401);
    }
    $decoded = json_decode(base64UrlDecode($payload), true);
    if (!is_array($decoded) || !isset($decoded['username'], $decoded['exp']) || (int) $decoded['exp'] < time()) {
        throw new ApiException('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
    }
    return ['username' => (string) $decoded['username'], 'role' => ($decoded['role'] ?? 'user') === 'admin' ? 'admin' : 'user'];
}

function requireAdmin(array $actor): void
{
    if (($actor['role'] ?? 'user') !== 'admin') {
        throw new ApiException('เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการเมนูได้', 403);
    }
}

function createToken(string $username, string $role, string $secret): string
{
    $payload = base64UrlEncode((string) json_encode(['username' => $username, 'role' => $role, 'exp' => time() + 60 * 60 * 12], JSON_THROW_ON_ERROR));
    return $payload . '.' . hash_hmac('sha256', $payload, $secret);
}

function passwordMatches(string $password, string $storedPassword): bool
{
    $info = password_get_info($storedPassword);
    if (($info['algo'] ?? 0) !== 0) {
        return password_verify($password, $storedPassword);
    }
    return hash_equals($storedPassword, $password);
}

/** @return array<string, mixed> */
function requestBody(): array
{
    $body = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($body)) {
        throw new ApiException('ข้อมูลที่ส่งมาไม่ถูกต้อง');
    }
    return $body;
}

/** @param array<string, mixed> $input @return array{name: string, category: string, price: float, imageUrl: string, description: string, available: bool} */
function validateProduct(array $input): array
{
    $name = trim((string) ($input['name'] ?? ''));
    $category = trim((string) ($input['category'] ?? 'ทั่วไป'));
    $price = (float) ($input['price'] ?? 0);
    $imageUrl = trim((string) ($input['imageUrl'] ?? ''));
    $description = trim((string) ($input['description'] ?? ''));
    $available = (bool) ($input['available'] ?? true);
    if ($name === '' || $price <= 0) {
        throw new ApiException('กรุณากรอกชื่อเมนูและราคาที่ถูกต้อง');
    }
    return ['name' => $name, 'category' => $category !== '' ? $category : 'ทั่วไป', 'price' => $price, 'imageUrl' => $imageUrl, 'description' => $description, 'available' => $available];
}

function positiveInt(mixed $value, string $message): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($number === false) {
        throw new ApiException($message);
    }
    return (int) $number;
}

/** @return array<string, mixed> */
function findProduct(PDO $pdo, int $id): array
{
    $statement = $pdo->prepare('SELECT id, productname, colors, price, img, description, available FROM Product WHERE id = ? LIMIT 1');
    $statement->execute([$id]);
    $row = $statement->fetch();
    if (!$row) {
        throw new ApiException('ไม่พบเมนูที่ต้องการ', 404);
    }
    return productResponse($row);
}

/** @param array<string, mixed> $row @return array<string, mixed> */
function productResponse(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'name' => (string) ($row['productname'] ?? ''),
        'category' => (string) ($row['colors'] ?? 'ทั่วไป'),
        'price' => (float) ($row['price'] ?? 0),
        'description' => (string) ($row['description'] ?? ''),
        'imageUrl' => (string) ($row['img'] ?? ''),
        'available' => (bool) ($row['available'] ?? true),
    ];
}

function userResponse(string $username, string $role = 'user'): array
{
    return ['id' => $username, 'username' => $username, 'email' => $username, 'role' => $role === 'admin' ? 'admin' : 'user'];
}

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64UrlDecode(string $value): string
{
    return base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4)) ?: '';
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
