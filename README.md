# MenuPilot

ระบบจัดการเมนูอาหารสำหรับร้านอาหาร สร้างด้วย Expo SDK 54, React Native, TypeScript และ Expo Router โดยเชื่อม MySQL ผ่าน Node.js API

## สิ่งที่ทำไว้

- React UI แบบ responsive สำหรับมือถือและเว็บ
- Navigation จริง: ภาพรวม, เมนู, ออเดอร์, ตั้งค่า
- ข้อมูล seed ใน `data/products.json`
- Login และสร้างบัญชีจากตาราง `user_pro` ใน MySQL
- แยกสิทธิ์ `admin` สำหรับเพิ่ม/แก้ไข/ลบเมนู และ `user` สำหรับดูข้อมูล
- CRUD เมนูจากตาราง `Product` ใน MySQL
- เพิ่ม แก้ไข ลบ เปิด/ปิดการขาย และค้นหาเมนู
- โหมดตัวอย่างสำหรับเปิดดู UI และทดสอบ CRUD โดยไม่ต้องมี Cloud config

## ตั้งค่า MySQL/phpMyAdmin และ Node API

Expo ห้ามเชื่อม MySQL โดยตรง เพราะจะทำให้รหัสผ่านฐานข้อมูลถูกฝังในแอป เซิร์ฟเวอร์ที่ได้รับมารองรับ Node.js และกำหนดพอร์ต `3011` จึงให้รัน [server.js](C:/Users/takt/Desktop/chanisa/chanisa/server.js:1) เป็น API:

1. Upload โปรเจกต์ขึ้น `/app` หรือ push แล้ว pull จาก repository
2. เข้า SSH แล้วรัน:

```bash
cd /app
npm ci
cp server.env.example .env
nano .env
npm run server
```

3. ใส่ค่า `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` และ `APP_SECRET` ใน `.env` ของเซิร์ฟเวอร์
4. เปิด [backend/migration.sql](C:/Users/takt/Desktop/chanisa/chanisa/backend/migration.sql:1) ใน phpMyAdmin แล้วรันหนึ่งครั้งกับตาราง `Product`
5. ตรวจสอบ API ที่ `http://119.59.102.161:3011/health` ควรได้ `{"ok":true}`
6. สร้างไฟล์ `.env.local` ในเครื่อง Expo แล้วชี้ไปที่ API:

```env
EXPO_PUBLIC_API_URL=http://119.59.102.161:3011
```

ห้ามใส่ user/password ของ MySQL ใน `.env.local` หรือใน Expo เพราะค่าที่ขึ้นต้นด้วย `EXPO_PUBLIC_` จะถูกฝังลงในแอป

## เริ่มใช้งาน

```bash
npm install
npx expo start
```

หากยังไม่มี `.env.local` ให้เลือก `เข้าโหมดตัวอย่าง` ในหน้า Login เพื่อทดสอบหน้าจอและ CRUD แบบ local

หมายเหตุ: ตาราง `Product` เดิมใช้ชื่อคอลัมน์ `colors` เป็นหมวดหมู่ และ API จะแปลงเป็น `category` ให้ Expo อัตโนมัติ หากนำขึ้น production ควรใช้ HTTPS แทน HTTP

หากมีตาราง `user_pro` อยู่แล้ว ให้รัน `backend/role-migration.sql` หนึ่งครั้ง แล้วเปลี่ยน `YOUR_ADMIN_USERNAME` เป็นชื่อผู้ใช้ของผู้ดูแลระบบ

## GitHub

Repository: https://github.com/chanisa-a/chanisa
