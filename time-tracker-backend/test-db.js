import pool from './db.js';

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MariaDB!');
    conn.release();
  } catch (err) {
    console.error('Unable to connect to MariaDB:', err);
  }
}

testConnection();