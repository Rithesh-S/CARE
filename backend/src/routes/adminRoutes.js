const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalyticsOverview,
  pushResolutionToStudent,
  reviewStaffExtension,
  createStaffMemo,
  getStaffMemos,
  getUnassignedIssues,
  getConfusingCritics,
  getPendingReviewIssues,
  assignIssue,
  reviewIssue,
  updateIssueAiData,
  blacklistStudent,
  getBlacklist,
  unbanStudent,
  getStaffList,
  getAllIssues,
  resolveAdminIssue,
  addStaff
} = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Overview & Statistics
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalyticsOverview);
router.get('/issues/all', getAllIssues);

// Triage queues
router.get('/issues/unassigned', getUnassignedIssues);
router.get('/issues/confusing-critics', getConfusingCritics);
router.get('/issues/pending-review', getPendingReviewIssues);

// Issue actions
router.post('/issues/:id/assign', assignIssue);
router.post('/issues/:id/review', reviewIssue);
router.post('/issues/:id/push-resolution', pushResolutionToStudent);
router.post('/issues/:id/review-extension', reviewStaffExtension);
router.post('/issues/:id/resolve-admin', upload.single('resolution_image'), resolveAdminIssue);
router.patch('/issues/:id/ai-data', updateIssueAiData);

// Staff Memos
router.post('/memos', createStaffMemo);
router.get('/memos', getStaffMemos);

// Spam & Blacklist Control
router.get('/blacklist', getBlacklist);
router.post('/blacklist', blacklistStudent);
router.delete('/blacklist/:hash', unbanStudent);

// Staff Directory
router.get('/staff', getStaffList);
router.post('/staff', addStaff);

module.exports = router;
