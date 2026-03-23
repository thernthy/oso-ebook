USE oso_ebook;

-- ─── Author-Partner Relationship & Reviews ─────────────────────────────────────
-- Manages the relationship between authors and partners with reviews/ratings

-- Partner codes for authors to reference
CREATE TABLE IF NOT EXISTS partner_codes (
  id              CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  partner_id      CHAR(36)      NOT NULL,
  code            VARCHAR(50)   NOT NULL UNIQUE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_code (code)
);

-- Author-Partner relationships
-- Tracks which authors work with which partners
CREATE TABLE IF NOT EXISTS author_partner_relations (
  id              CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  author_id       CHAR(36)      NOT NULL,
  partner_id      CHAR(36)      NOT NULL,
  status          ENUM('active', 'paused', 'terminated') NOT NULL DEFAULT 'active',
  termination_reason TEXT,
  terminated_by   CHAR(36),
  terminated_at   TIMESTAMP,
  started_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_relation (author_id, partner_id),
  INDEX idx_author (author_id),
  INDEX idx_partner (partner_id),
  INDEX idx_status (status)
);

-- Partner reviews/auth assessments of authors they work with
CREATE TABLE IF NOT EXISTS author_reviews (
  id              CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  relation_id     CHAR(36)      NOT NULL,
  author_id       CHAR(36)      NOT NULL,
  partner_id      CHAR(36)      NOT NULL,
  
  -- Review ratings (1-5)
  communication_rating  TINYINT   CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating       TINYINT   CHECK (quality_rating BETWEEN 1 AND 5),
  reliability_rating   TINYINT   CHECK (reliability_rating BETWEEN 1 AND 5),
  professionalism_rating TINYINT  CHECK (professionalism_rating BETWEEN 1 AND 5),
  
  -- Overall rating (calculated from above or manual)
  overall_rating       DECIMAL(3,2) DEFAULT 0,
  
  -- Review content
  review_title    VARCHAR(200),
  review_text     TEXT,
  
  -- Response from author
  author_response TEXT,
  author_responded_at TIMESTAMP,
  
  -- Status
  is_published    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (relation_id) REFERENCES author_partner_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_partner (partner_id),
  INDEX idx_created (created_at)
);

-- Author's reviews of partners (optional - partners can be rated too)
CREATE TABLE IF NOT EXISTS partner_reviews (
  id              CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  relation_id     CHAR(36)      NOT NULL,
  author_id       CHAR(36)      NOT NULL,
  partner_id      CHAR(36)      NOT NULL,
  
  -- Ratings
  support_rating  TINYINT   CHECK (support_rating BETWEEN 1 AND 5),
  fairness_rating TINYINT   CHECK (fairness_rating BETWEEN 1 AND 5),
  communication_rating TINYINT CHECK (communication_rating BETWEEN 1 AND 5),
  
  overall_rating  DECIMAL(3,2) DEFAULT 0,
  
  -- Review content
  review_text     TEXT,
  
  -- Partner response
  partner_response TEXT,
  partner_responded_at TIMESTAMP,
  
  -- Status
  is_published    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (relation_id) REFERENCES author_partner_relations(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_partner (partner_id)
);

-- Insert a default partner code for existing partners
-- This is handled separately after users exist
-- INSERT INTO partner_codes (partner_id, code)
-- SELECT id, CONCAT('PART-', UPPER(SUBSTRING(REPLACE(uuid, '-', ''), 1, 8)))
-- FROM users WHERE role = 'partner'
-- ON DUPLICATE KEY UPDATE is_active = is_active;
