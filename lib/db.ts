import mysql from 'mysql2/promise'

/**
 * Database Connection Singleton
 * Prevents "Too many connections" error in Next.js development (hot-reloading).
 */

const globalForPool = global as unknown as { pool: mysql.Pool }

export const pool =
  globalForPool.pool ||
  mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'oso_ebook',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0,
  })

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool

export default pool
