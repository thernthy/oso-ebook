USE oso_ebook;

-- ─── Books ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  title       VARCHAR(200)  NOT NULL,
  description TEXT          NULL,
  cover_url   VARCHAR(500)  NULL,
  author_id   CHAR(36)      NOT NULL,
  partner_id  CHAR(36)      NOT NULL,
  status      ENUM('draft','in_review','published','rejected') NOT NULL DEFAULT 'draft',
  price       DECIMAL(8,2)  NOT NULL DEFAULT 0.00,  -- 0.00 = free
  is_free     TINYINT(1)    NOT NULL DEFAULT 0,
  is_featured TINYINT(1)    NOT NULL DEFAULT 0,
  category    VARCHAR(100)  NULL,
  total_reads INT           NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (author_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author   (author_id),
  INDEX idx_partner  (partner_id),
  INDEX idx_status   (status),
  INDEX idx_featured (is_featured),
  INDEX idx_category (category)
);

-- ─── Chapters ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id           CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  book_id      CHAR(36)      NOT NULL,
  chapter_num  INT           NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  content      LONGTEXT      NULL,
  word_count   INT           NOT NULL DEFAULT 0,
  is_published TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY uq_book_chapter (book_id, chapter_num),
  INDEX idx_book (book_id)
);

-- ─── Reader purchases ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36)     NOT NULL,
  book_id    CHAR(36)     NOT NULL,
  price_paid DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_book (user_id, book_id)
);

-- ─── Reading progress ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_progress (
  id           CHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id      CHAR(36)  NOT NULL,
  book_id      CHAR(36)  NOT NULL,
  chapter_id   CHAR(36)  NOT NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (book_id)    REFERENCES books(id)     ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_user_book_progress (user_id, book_id)
);
