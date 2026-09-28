const jwt = require('jsonwebtoken');
const BannedHash = require('../models/BannedHash');

/**
 * Middleware to authenticate JWT token from Authorization Bearer header
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'AUTH_REQUIRED', 
      message: 'Authorization token is missing. Please log in.' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'spillit_super_secret_jwt_key_skcet_2026_x99!';

  jwt.verify(token, jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'INVALID_TOKEN', 
        message: 'Invalid or expired session token. Please re-authenticate.' 
      });
    }

    req.user = decoded;

    // Check if the student hash is blacklisted
    if (req.user.hashed_student_id) {
      try {
        const isBanned = await BannedHash.findOne({ 
          hashed_student_id: req.user.hashed_student_id 
        });

        if (isBanned) {
          return res.status(403).json({
            success: false,
            error: 'BANNED_STUDENT_HASH',
            message: 'Your account has been suspended from submitting grievances due to policy violations or spam.',
            banned_at: isBanned.createdAt,
            reason: isBanned.reason
          });
        }
      } catch (dbErr) {
        console.error('[Auth Middleware] Blacklist check error:', dbErr);
      }
    }

    next();
  });
}

/**
 * Middleware to enforce specific user roles
 * @param {string[]} roles - Array of allowed roles e.g. ['ADMIN'] or ['STAFF', 'ADMIN']
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: `Access forbidden. Requires one of roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
