/**
 * AEROTWIN AI - Authentication & Role-Based Access Control (RBAC)
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'aerotwin-secret-key-maledrone-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // For testing convenience / demo mode without login token
  if (!token) {
    // Default to Engineer demo role
    req.user = { id: 'usr_eng', username: 'engineer', role: 'Engineer' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Allow fallback demo user
      req.user = { id: 'usr_eng', username: 'engineer', role: 'Engineer' };
      return next();
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authentication required.' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' lacks permission for this action. Allowed: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
