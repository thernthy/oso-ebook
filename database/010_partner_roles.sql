USE oso_ebook;

-- ─── Custom Partner Roles ──────────────────────────────────
-- Partners can create custom roles for their authors
CREATE TABLE IF NOT EXISTS partner_roles (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  partner_id  CHAR(36)      NOT NULL,
  name        VARCHAR(50)   NOT NULL,
  description VARCHAR(255)   NULL,
  color       VARCHAR(20)   NOT NULL DEFAULT '#9d7df5',
  permissions JSON          NOT NULL DEFAULT '[]',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_partner_role (partner_id, name),
  INDEX idx_partner (partner_id)
);

-- ─── Role Permissions ──────────────────────────────────────
-- Available permissions that can be assigned to roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  role_id     CHAR(36)      NOT NULL,
  permission  VARCHAR(100)  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES partner_roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission),
  INDEX idx_role (role_id)
);

-- ─── Author Role Assignments ────────────────────────────────
-- Assign custom roles to authors
CREATE TABLE IF NOT EXISTS author_role_assignments (
  id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  author_id   CHAR(36)      NOT NULL,
  role_id     CHAR(36)      NOT NULL,
  assigned_by CHAR(36)      NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES partner_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_author_role (author_id, role_id),
  INDEX idx_author (author_id)
);

-- ─── Default Role Permissions ──────────────────────────────
-- Common permission presets
-- upload_books, edit_own_books, delete_own_books, manage_chapters, 
-- view_own_earnings, submit_for_review, invite_co_authors, 
-- manage_promo_codes, view_reader_stats, access_analytics
