const Issue = require('../models/Issue');

/**
 * Get issues assigned to the logged-in staff member
 */
async function getMyAssignedIssues(req, res) {
  try {
    const staffId = req.user.userId;
    const { status } = req.query;

    const query = { assigned_to: staffId };
    if (status) {
      query.status = status;
    } else {
      // Default: show both currently active ASSIGNED_STAFF and PENDING_REVIEW and POSTED
      query.status = { $in: ['ASSIGNED_STAFF', 'PENDING_REVIEW', 'POSTED'] };
    }

    const issues = await Issue.find(query)
      .sort({ ai_critical_score: -1, createdAt: -1 })
      .lean();

    // Attach computed SLA status (is_overdue, hours_remaining)
    const now = new Date();
    const enriched = issues.map(issue => {
      let is_overdue = false;
      let hours_remaining = null;

      if (issue.sla_deadline) {
        const diffMs = new Date(issue.sla_deadline) - now;
        hours_remaining = Math.round(diffMs / (1000 * 60 * 60));
        if (diffMs < 0 && issue.status === 'ASSIGNED_STAFF') {
          is_overdue = true;
        }
      }

      return {
        ...issue,
        is_overdue,
        hours_remaining
      };
    });

    return res.json({
      success: true,
      count: enriched.length,
      issues: enriched
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Resolve an assigned issue by uploading live "After" photo
 * Status transitions from ASSIGNED_STAFF to PENDING_REVIEW
 */
async function resolveIssue(req, res) {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'IMAGE_REQUIRED',
        message: 'A live resolution photo ("After" capture) is strictly required to mark this task resolved.'
      });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Verify permission: Must be assigned to this staff member or user is Admin
    if (issue.assigned_to && issue.assigned_to.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this issue.'
      });
    }

    const resolution_image_url = `/uploads/${req.file.filename}`;

    issue.resolution_image_url = resolution_image_url;
    issue.resolution_notes = resolution_notes || '';
    issue.status = 'PENDING_REVIEW';
    issue.resolved_at = new Date();

    await issue.save();

    return res.json({
      success: true,
      message: 'Resolution submitted successfully. Issue is now queued for admin review.',
      issue
    });
  } catch (error) {
    console.error('[Staff Resolve Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Request SLA Extension (Staff)
 * If staff cannot complete within due time for a valid reason,
 * request an extension of specific days with a clear rationale.
 */
async function requestSlaExtension(req, res) {
  try {
    const { id } = req.params;
    const { days, reason } = req.body;

    if (!days || isNaN(days) || Number(days) < 1 || Number(days) > 14) {
      return res.status(400).json({
        success: false,
        message: 'Extension days must be a number between 1 and 14.'
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A valid explanation/reason of at least 5 characters is required for an SLA extension.'
      });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Verify assignment
    if (issue.assigned_to && issue.assigned_to.toString() !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to request an extension for this issue.'
      });
    }

    issue.extension_requested = true;
    issue.extension_days = Number(days);
    issue.extension_reason = reason.trim();
    issue.extension_status = 'PENDING';
    issue.extension_requested_at = new Date();

    await issue.save();

    return res.json({
      success: true,
      message: `Extension request for ${days} days submitted successfully. Awaiting admin approval.`,
      issue
    });
  } catch (error) {
    console.error('[Request Extension Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMyAssignedIssues,
  resolveIssue,
  requestSlaExtension
};
