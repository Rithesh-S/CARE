const express = require('express');
const router = express.Router();
const { getMyAssignedIssues, resolveIssue, requestSlaExtension } = require('../controllers/staffController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// Staff routes require authentication and STAFF or ADMIN role
router.use(authenticateToken);
router.use(requireRole(['STAFF', 'ADMIN']));

// View assigned issues
router.get('/issues', getMyAssignedIssues);

// Resolve issue by uploading live "After" photo
router.post('/issues/:id/resolve', upload.single('resolution_image'), resolveIssue);

// Request SLA deadline extension with reason
router.post('/issues/:id/request-extension', requestSlaExtension);

module.exports = router;
