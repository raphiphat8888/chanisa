-- Run once in phpMyAdmin after selecting the existing database.
-- These columns let the Expo app persist descriptions and open/closed status.
ALTER TABLE Product
  ADD COLUMN description VARCHAR(1000) NOT NULL DEFAULT '',
  ADD COLUMN available TINYINT(1) NOT NULL DEFAULT 1;
