USE oso_ebook;

-- ─── Book cover metadata ────────────────────────────────────────
-- Add to books table if upgrading from earlier migration
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS cover_thumb_url   VARCHAR(500) NULL AFTER cover_url,
  ADD COLUMN IF NOT EXISTS cover_width       INT          NULL AFTER cover_thumb_url,
  ADD COLUMN IF NOT EXISTS cover_height      INT          NULL AFTER cover_width,
  ADD COLUMN IF NOT EXISTS cover_storage_key VARCHAR(500) NULL AFTER cover_height,
  ADD COLUMN IF NOT EXISTS cover_thumb_key   VARCHAR(500) NULL AFTER cover_storage_key;

-- ─── Platform settings (OSO configures storage provider here) ─
CREATE TABLE IF NOT EXISTS platform_settings (
  id          INT          NOT NULL PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT         NOT NULL,
  updated_by  CHAR(36)     NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Default: local storage
INSERT IGNORE INTO platform_settings (setting_key, value) VALUES
  ('storage_provider',  'local'),          -- 'local' | 's3'
  ('storage_local_dir', 'uploads/books'),  -- relative to project root
  ('storage_s3_bucket', ''),
  ('storage_s3_region', ''),
  ('storage_s3_key',    ''),
  ('storage_s3_secret', ''),
  ('storage_s3_endpoint', ''),             -- for S3-compatible (R2, MinIO etc.)
  ('max_upload_mb',     '50'),
  ('allowed_formats',   'pdf,epub,docx,txt'),
  -- Cover image standards
  ('cover_width',       '1600'),   -- px, full resolution
  ('cover_height',      '2400'),   -- px, full resolution (2:3 ratio)
  ('cover_thumb_width', '320'),    -- px, catalog thumbnail
  ('cover_thumb_height','480'),    -- px, catalog thumbnail
  ('cover_formats',     'jpg,jpeg,png,webp'),
  ('cover_max_mb',      '10');

-- ─── Book files ───────────────────────────────────────────────
-- Each book can have one active source file per format
CREATE TABLE IF NOT EXISTS book_files (
  id           CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  book_id      CHAR(36)     NOT NULL,
  format       ENUM('pdf','epub','docx','txt') NOT NULL,
  original_name VARCHAR(300) NOT NULL,
  storage_key  VARCHAR(500) NOT NULL,       -- path on local FS or S3 key
  file_size    INT          NOT NULL,       -- bytes
  status       ENUM('uploaded','processing','processed','failed') NOT NULL DEFAULT 'uploaded',
  error_msg    TEXT         NULL,
  uploaded_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_book   (book_id),
  INDEX idx_status (status)
);

-- ─── AI processing jobs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_jobs (
  id           CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  book_id      CHAR(36)     NOT NULL,
  file_id      CHAR(36)     NOT NULL,
  status       ENUM('queued','running','done','failed') NOT NULL DEFAULT 'queued',
  chapters_found INT        NOT NULL DEFAULT 0,
  result       JSON         NULL,           -- raw AI response stored for debugging
  error_msg    TEXT         NULL,
  started_at   TIMESTAMP    NULL,
  finished_at  TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES book_files(id) ON DELETE CASCADE,
  INDEX idx_book   (book_id),
  INDEX idx_status (status)
);

-- ─── Bookmarks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          CHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36)  NOT NULL,
  book_id     CHAR(36)  NOT NULL,
  chapter_id  CHAR(36)  NOT NULL,
  note        TEXT      NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (book_id)    REFERENCES books(id)     ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)  ON DELETE CASCADE,
  INDEX idx_user_book (user_id, book_id)
);
