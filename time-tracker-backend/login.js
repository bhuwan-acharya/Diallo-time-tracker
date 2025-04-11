import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

// Array to store refresh tokens
const refreshTokens = [];

/**
 * Login API Endpoint
 * Validates user credentials and returns a JWT on success.
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();

    if (rows.length === 0) {
      console.error('User not found:', email);
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate access token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Generate refresh token
    const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
    refreshTokens.push(refreshToken); // Store the refresh token

    res.status(200).json({ message: 'Login successful.', token, refreshToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Token is valid.', user });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});