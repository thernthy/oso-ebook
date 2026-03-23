const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'oso_ebook',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
  })

  const params = { id: 'some-book-uuid' };
  const userId = 'some-user-uuid';

  try {
    console.log('Starting parallel queries...');
    const [
      [books],
      [chapters],
      [files],
      [stats],
    ] = await Promise.all([
      pool.execute(
        `SELECT b.*, p.name AS partner_name
         FROM books b
         LEFT JOIN users p ON b.partner_id = p.id
         WHERE b.id = ? AND b.author_id = ? LIMIT 1`,
        [params.id, userId]
      ),
      pool.execute(
        `SELECT id, chapter_num, title, word_count, is_published, created_at
         FROM chapters WHERE book_id = ? ORDER BY chapter_num ASC`,
        [params.id]
      ),
      pool.execute(
        `SELECT bf.id, bf.format, bf.original_name, bf.file_size, bf.status AS file_status,
                aj.id AS job_id, aj.status AS ai_status, aj.chapters_found,
                aj.error_msg AS ai_error, aj.finished_at
         FROM book_files bf
         LEFT JOIN ai_jobs aj ON aj.file_id = bf.id
         WHERE bf.book_id = ?
         ORDER BY bf.uploaded_at DESC LIMIT 1`,
        [params.id]
      ),
      pool.execute(
        `SELECT 
           COUNT(CASE WHEN is_published = 1 THEN 1 END) AS published_chapters,
           COALESCE(SUM(word_count), 0) AS total_words,
           (SELECT COUNT(*) FROM reading_progress WHERE book_id = ?) AS total_reading_sessions
         FROM chapters WHERE book_id = ?`,
        [params.id, params.id]
      ),
    ]);

    console.log('Queries completed successfully.');
  } catch (err) {
    console.error('MySQL Error:', err);
  }

  await pool.end();
}

test().catch(console.error);
