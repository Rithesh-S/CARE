const express = require('express');
const router = express.Router();
const { 
  submitIssue, 
  getMySubmissions, 
  getPublicFeed, 
  getIssueById,
  dismissAlert
} = require('../controllers/issueController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// Public Feed of approved & posted grievances
router.get('/feed', getPublicFeed);

// Student submit grievance: supports both multipart photo upload and textual submissions
router.post(
  '/', 
  authenticateToken, 
  requireRole(['STUDENT']), 
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.warn('[Multer Warning]:', err.message);
      }
      next();
    });
  }, 
  submitIssue
);

// Student get their own anonymous submissions with remaining quota info
router.get(
  '/my-submissions', 
  authenticateToken, 
  requireRole(['STUDENT']), 
  getMySubmissions
);

// Get issue by ID
router.get('/:id', authenticateToken, getIssueById);

// Dismiss alert
router.post(
  '/:id/dismiss-alert',
  authenticateToken,
  requireRole(['STUDENT']),
  dismissAlert
);

module.exports = router;
