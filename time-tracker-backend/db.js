import mariadb from 'mariadb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10), // Convert to integer
});

export default pool;