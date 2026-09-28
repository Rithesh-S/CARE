const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BannedHash = require('../models/BannedHash');
const { hashStudentEmail, isDomainPermitted } = require('../services/anonymizer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper to generate JWT token
 */
function generateToken(payload) {
  const jwtSecret = process.env.JWT_SECRET || 'spillit_super_secret_jwt_key_skcet_2026_x99!';
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

/**
 * Handles Google OAuth Authentication & Stateless Token Issuance
 * Accepts either a Google idToken (from Google Sign In) or dev payload.
 */
async function googleAuth(req, res) {
  try {
    const { id_token, email: devEmail, name: devName } = req.body;

    let email = devEmail;
    let name = devName || 'Campus User';

    // If a Google id_token is provided, verify it with Google OAuth2Client
    if (id_token && !devEmail) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const googlePayload = ticket.getPayload();
        email = googlePayload.email;
        name = googlePayload.name || 'Campus User';
      } catch (tokenErr) {
        // If client ID is not configured yet or in dev mode with mock token
        if (process.env.NODE_ENV === 'development' || !process.env.GOOGLE_CLIENT_ID) {
          console.warn('[Google Auth] ID Token verification skipped in dev mode or mock token received');
        } else {
          return res.status(401).json({
            success: false,
            error: 'INVALID_GOOGLE_TOKEN',
            message: 'Failed to verify Google Sign-In token: ' + tokenErr.message
          });
        }
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'Institutional email is required for authentication.'
      });
    }

    email = email.toLowerCase().trim();

    // 1. Strict Domain Restriction: Must end in @skcet.ac.in
    if (!isDomainPermitted(email)) {
      return res.status(403).json({
        success: false,
        error: 'DOMAIN_RESTRICTED',
        message: `Access denied. Spill It is restricted strictly to @${process.env.ALLOWED_DOMAIN || 'skcet.ac.in'} institutional accounts.`
      });
    }

    // 2. Check if this matches the single designated Admin Email in ENV
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@skcet.ac.in').toLowerCase().trim();

    if (email === configuredAdminEmail) {
      let adminUser = await User.findOne({ email });
      if (!adminUser) {
        adminUser = await User.create({
          name: name || 'Chief Campus Administrator',
          email: email,
          role: 'ADMIN'
        });
      } else if (adminUser.role !== 'ADMIN') {
        adminUser.role = 'ADMIN';
        await adminUser.save();
      }

      const payload = {
        userId: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'ADMIN'
      };

      const token = generateToken(payload);

      return res.json({
        success: true,
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'ADMIN'
        }
      });
    }

    // 3. Check if this is an authorized Staff member registered in database
    const staffUser = await User.findOne({ email, role: 'STAFF' });

    if (staffUser) {
      const payload = {
        userId: staffUser._id,
        email: staffUser.email,
        name: staffUser.name,
        role: 'STAFF'
      };

      const token = generateToken(payload);

      return res.json({
        success: true,
        token,
        user: {
          id: staffUser._id,
          name: staffUser.name,
          email: staffUser.email,
          role: 'STAFF'
        }
      });
    }

    // 3. Otherwise, this is a STUDENT
    // Anonymization Engine: HMAC-SHA256 hash generated. Student email is NEVER persisted!
    const hashedStudentId = hashStudentEmail(email);

    // Check if the student's HMAC hash is on the spam/ban blacklist
    const isBanned = await BannedHash.findOne({ hashed_student_id: hashedStudentId });
    if (isBanned) {
      return res.status(403).json({
        success: false,
        error: 'BANNED_STUDENT_HASH',
        message: 'Your account has been banned from submitting grievances due to spam or policy violations.',
        banned_at: isBanned.createdAt,
        reason: isBanned.reason
      });
    }

    const payload = {
      role: 'STUDENT',
      hashed_student_id: hashedStudentId
    };

    const token = generateToken(payload);

    return res.json({
      success: true,
      token,
      user: {
        role: 'STUDENT',
        hashed_student_id: hashedStudentId,
        display_id: 'STUDENT-' + hashedStudentId.substring(0, 8).toUpperCase()
      }
    });

  } catch (error) {
    console.error('[Google Auth Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'AUTH_SERVER_ERROR',
      message: error.message || 'Internal server error during authentication'
    });
  }
}

/**
 * Get current session user info from JWT
 */
async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (req.user.role === 'STUDENT') {
      return res.json({
        success: true,
        user: {
          role: 'STUDENT',
          hashed_student_id: req.user.hashed_student_id,
          display_id: 'STUDENT-' + req.user.hashed_student_id.substring(0, 8).toUpperCase()
        }
      });
    }

    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  googleAuth,
  getMe
};
