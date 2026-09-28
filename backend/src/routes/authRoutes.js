const express = require('express');
const router = express.Router();
const { googleAuth, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Public auth endpoints
router.post('/google', googleAuth);
router.post('/dev-login', googleAuth);

// Protected session check
router.get('/me', authenticateToken, getMe);

module.exports = router;
