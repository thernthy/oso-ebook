const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'freedb_oso_db',
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS ip_rules (
      id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
      ip_address  VARCHAR(45)   NOT NULL,
      action      ENUM('block','allow') NOT NULL DEFAULT 'block',
      note        VARCHAR(255)   NULL,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ip_address (ip_address)
    )`,
    `CREATE TABLE IF NOT EXISTS logs (
      id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
      level       ENUM('info','warn','error','debug') NOT NULL DEFAULT 'info',
      message     VARCHAR(500)  NOT NULL,
      context     TEXT          NULL,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_level (level),
      INDEX idx_created (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS partner_roles (
      id          CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
      partner_id  CHAR(36)      NOT NULL,
      name        VARCHAR(50)   NOT NULL,
      description VARCHAR(255)   NULL,
      color       VARCHAR(20)   NOT NULL DEFAULT '#9d7df5',
      permissions JSON          NOT NULL DEFAULT ('[]'),
      is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_partner_role (partner_id, name),
      INDEX idx_partner (partner_id)
    )`,
    `CREATE TABLE IF NOT EXISTS author_role_assignments (
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
    )`,
  ];

  try {
    console.log('Running migration: 010_partner_roles.sql');
    for (const sql of statements) {
      await pool.query(sql);
      console.log('✅ Table created successfully');
    }
    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
