// filepath: c:\Users\bhuwa\Desktop\Dialo time tracking project\time-tracker-backend\authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token is missing or invalid.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user; // Attach the decoded user information to the request
    next();
  });
}

module.exports = authenticateToken;