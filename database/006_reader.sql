USE freedb_oso_db;

-- purchases already created in 002, ensure it exists
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

-- reading_progress already created in 002, extend it
ALTER TABLE reading_progress
  ADD COLUMN scroll_pct    TINYINT  NOT NULL DEFAULT 0,
  ADD COLUMN page_num      INT      NOT NULL DEFAULT 1,
  ADD COLUMN total_pages   INT      NOT NULL DEFAULT 1,
  ADD COLUMN time_spent_s  INT      NOT NULL DEFAULT 0;

-- bookmarks already created in 004, ensure it exists
CREATE TABLE IF NOT EXISTS bookmarks (
  id          CHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id     CHAR(36)  NOT NULL,
  book_id     CHAR(36)  NOT NULL,
  chapter_id  CHAR(36)  NOT NULL,
  page_num    INT       NOT NULL DEFAULT 1,
  note        TEXT      NULL,
  highlight   TEXT      NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (book_id)    REFERENCES books(id)     ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)  ON DELETE CASCADE,
  INDEX idx_user_book (user_id, book_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         CHAR(36)    NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id    CHAR(36)    NOT NULL,
  book_id    CHAR(36)    NOT NULL,
  rating     TINYINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT        NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_book_review (user_id, book_id),
  INDEX idx_book (book_id)
);

-- Reader preferences (font size, theme, font family etc.)
CREATE TABLE IF NOT EXISTS reader_preferences (
  user_id      CHAR(36)    NOT NULL PRIMARY KEY,
  font_size    TINYINT     NOT NULL DEFAULT 16,
  font_family  VARCHAR(50) NOT NULL DEFAULT 'serif',
  theme        ENUM('dark','light','sepia') NOT NULL DEFAULT 'dark',
  line_height  FLOAT       NOT NULL DEFAULT 1.8,
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
