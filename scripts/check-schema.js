const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'oso_ebook',
  });

  const [rows] = await connection.query('DESCRIBE chapters');
  console.log('Chapters table schema:', rows);

  const [readingRows] = await connection.query('DESCRIBE reading_progress');
  console.log('Reading Progress table schema:', readingRows);

  await connection.end();
}

check().catch(console.error);
