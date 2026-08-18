-- Run once for an existing user_pro table that does not have role yet.
ALTER TABLE user_pro
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Replace the username below with the account that should be the administrator.
UPDATE user_pro
SET role = 'admin'
WHERE user_name = 'YOUR_ADMIN_USERNAME';
