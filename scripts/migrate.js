const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MySQL server.');

  const dbName = process.env.DB_NAME || 'oso_ebook';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.query(`USE \`${dbName}\`;`);
  console.log(`Using database: ${dbName}`);

  const migrationFiles = [
    '001_users_roles.sql',
    '002_books.sql',
    '003_partners.sql',
    '004_author_features.sql',
    '005_revenue.sql',
    '006_reader.sql',
    '007_author_partner_reviews.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, '../database', file);
    if (fs.existsSync(filePath)) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split by semicolon but ignore semicolons inside quotes or comments if possible
      // For simplicity in a basic migration script:
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      
      for (const statement of statements) {
        await connection.query(statement);
      }
    }
  }

  console.log('Migrations completed successfully.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
