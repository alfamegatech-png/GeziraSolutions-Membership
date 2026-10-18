const jwt = require('jsonwebtoken');

// Middleware to verify token and set user in the request
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'A token is required for authentication' });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Add decoded token to request object

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check user role
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authorizeRole: authorizeRole,
  verifyToken: verifyToken
};
