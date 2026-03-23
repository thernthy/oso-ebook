USE oso_ebook;

CREATE TABLE IF NOT EXISTS ip_rules (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  ip_address  VARCHAR(45)   NOT NULL,
  action      ENUM('block','allow') NOT NULL DEFAULT 'block',
  note        VARCHAR(255)   NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_ip_address (ip_address)
);
