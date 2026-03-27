-- freedb_oso_db database setup
-- Run once: mysql -u root -p < database/001_users_roles.sql

CREATE DATABASE IF NOT EXISTS freedb_oso_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE freedb_oso_db;

CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,             -- bcrypt hash only, never plain text
  role       ENUM('oso','partner','author','reader') NOT NULL DEFAULT 'reader',
  partner_id CHAR(36)     NULL,                 -- authors: which partner invited them
  status     ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_role      (role),
  INDEX idx_partner   (partner_id),
  INDEX idx_status    (status)
);

-- ─── Seed: OSO super-admin ────────────────────────────────────
-- Password: Admin@123  (bcrypt hash — change immediately after first login!)
INSERT IGNORE INTO users (id, name, email, password, role, status) VALUES (
  UUID(),
  'OSO Admin',
  'admin@oso-ebook.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NlUfDxZxW',
  'oso',
  'active'
);
