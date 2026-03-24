USE oso_ebook;

-- Add phone column to users table for reader signup
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER email;

-- Add phone_prefix to platform settings (default +855 for Cambodia)
INSERT IGNORE INTO platform_settings (setting_key, value) VALUES
  ('phone_prefix', '+855');
