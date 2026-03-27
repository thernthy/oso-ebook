USE freedb_oso_db;

-- ─── Earnings ledger ─────────────────────────────────────────
-- Every purchase creates earnings rows for author + partner + platform
CREATE TABLE IF NOT EXISTS earnings (
  id          CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  purchase_id CHAR(36)     NOT NULL,
  book_id     CHAR(36)     NOT NULL,
  user_id     CHAR(36)     NOT NULL,   -- who earns (author or partner)
  role        ENUM('author','partner','platform') NOT NULL,
  amount      DECIMAL(8,2) NOT NULL,
  currency    CHAR(3)      NOT NULL DEFAULT 'USD',
  status      ENUM('pending','paid') NOT NULL DEFAULT 'pending',
  paid_at     TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_book   (book_id),
  INDEX idx_status (status),
  INDEX idx_role   (role)
);

-- ─── Payout records ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id          CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  amount      DECIMAL(8,2) NOT NULL,
  currency    CHAR(3)      NOT NULL DEFAULT 'USD',
  status      ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  reference   VARCHAR(200) NULL,      -- payment gateway reference
  processed_by CHAR(36)   NULL,       -- OSO user who triggered it
  processed_at TIMESTAMP  NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user   (user_id),
  INDEX idx_status (status)
);

-- ─── Revenue split config ─────────────────────────────────────
-- OSO can configure the split percentages globally
INSERT IGNORE INTO platform_settings (setting_key, value) VALUES
  ('revenue_author_pct',   '70'),   -- author gets 70% of sale price
  ('revenue_partner_pct',  '20'),   -- partner gets 20%
  ('revenue_platform_pct', '10');   -- platform keeps 10%
