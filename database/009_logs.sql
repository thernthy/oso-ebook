USE freedb_oso_db;

CREATE TABLE IF NOT EXISTS logs (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  level       ENUM('info','warn','error','debug') NOT NULL DEFAULT 'info',
  message     VARCHAR(500)  NOT NULL,
  context     TEXT          NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_level (level),
  INDEX idx_created (created_at)
);
