const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'oso_ebook',
  });

  console.log('Connected to database for seeding.');

  const password = 'Password@123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const testUsers = [
    { name: 'OSO Admin', email: 'admin@oso.com', role: 'oso' },
    { name: 'Partner User', email: 'partner@partner.com', role: 'partner' },
    { name: 'Author User', email: 'author@author.com', role: 'author' },
    { name: 'Reader User', email: 'reader@reader.com', role: 'reader' },
  ];

  for (const user of testUsers) {
    console.log(`Seeding user: ${user.name} (${user.role})`);
    await connection.query(
      `INSERT IGNORE INTO users (id, name, email, password, role, status) VALUES (UUID(), ?, ?, ?, ?, 'active')`,
      [user.name, user.email, hashedPassword, user.role]
    );
  }

  console.log('Seeding completed successfully.');
  await connection.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
