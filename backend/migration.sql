-- Run this file once in phpMyAdmin after selecting ip_std6730202084.

CREATE TABLE IF NOT EXISTS user_pro (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_name VARCHAR(100) NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  PRIMARY KEY (id),
  UNIQUE KEY user_pro_user_name_unique (user_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Product (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  productname VARCHAR(255) NOT NULL,
  colors VARCHAR(100) NOT NULL DEFAULT 'ทั่วไป',
  price DECIMAL(10, 2) NOT NULL,
  img VARCHAR(1000) NOT NULL DEFAULT '',
  description VARCHAR(1000) NOT NULL DEFAULT '',
  available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add starter products only when the table is empty.
INSERT INTO Product (productname, colors, price, img, description, available)
SELECT 'ข้าวกะเพราเนื้อไข่ดาว', 'จานหลัก', 159.00,
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
  'เนื้อสับผัดกะเพรา เสิร์ฟพร้อมไข่ดาวกรอบ', 1
WHERE NOT EXISTS (SELECT 1 FROM Product LIMIT 1);

INSERT INTO Product (productname, colors, price, img, description, available)
SELECT 'ผัดไทยกุ้งสด', 'เส้น', 169.00,
  'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=80',
  'เส้นจันท์เหนียวนุ่ม กุ้งสดตัวโต และซอสสูตรของร้าน', 1
WHERE NOT EXISTS (SELECT 1 FROM Product LIMIT 1);

INSERT INTO Product (productname, colors, price, img, description, available)
SELECT 'ปีกไก่ทอดน้ำปลา', 'ของทานเล่น', 129.00,
  'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=900&q=80',
  'ปีกไก่ทอดกรอบ หอมกลิ่นน้ำปลา เสิร์ฟ 6 ชิ้น', 1
WHERE NOT EXISTS (SELECT 1 FROM Product LIMIT 1);

INSERT INTO Product (productname, colors, price, img, description, available)
SELECT 'ชาไทยเย็น', 'เครื่องดื่ม', 65.00,
  'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80',
  'ชาไทยเข้มข้น หวานมันกำลังดี เสิร์ฟพร้อมน้ำแข็ง', 1
WHERE NOT EXISTS (SELECT 1 FROM Product LIMIT 1);
