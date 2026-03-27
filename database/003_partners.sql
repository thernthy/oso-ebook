USE freedb_oso_db;

-- ─── Partner Applications ─────────────────────────────────────
-- Tracks partner onboarding requests before they become users
CREATE TABLE IF NOT EXISTS partner_applications (
  id           CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  company      VARCHAR(200)  NULL,
  message      TEXT          NULL,
  status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by  CHAR(36)      NULL,             -- OSO user who acted on it
  reviewed_at  TIMESTAMP     NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
);

-- ─── Author Invitations ───────────────────────────────────────
-- Partners invite authors via token-based email invite
CREATE TABLE IF NOT EXISTS author_invitations (
  id           CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email        VARCHAR(150)  NOT NULL,
  partner_id   CHAR(36)      NOT NULL,
  token        CHAR(64)      NOT NULL UNIQUE,
  status       ENUM('pending','accepted','expired') NOT NULL DEFAULT 'pending',
  expires_at   TIMESTAMP     NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token  (token),
  INDEX idx_email  (email),
  INDEX idx_status (status)
);
