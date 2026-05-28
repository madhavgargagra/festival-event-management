// Authentication middleware verifying JWT tokens from headers or cookies
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  let token = null;

  // 1. Retrieve token from Authorization header or Cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    token = cookies['token'];
  }

  // 2. If token is missing, redirect to login or return JSON error
  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Access denied. Token missing.' });
    }
    return res.redirect('/login');
  }

  try {
    // 3. Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_festival_key_12345');
    req.user = decoded; // Attach decoded payload to request
    res.locals.user = decoded; // Attach to EJS view local rendering variables
    next();
  } catch (err) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    return res.redirect('/login');
  }
};
