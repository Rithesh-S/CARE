const Issue = require('../models/Issue');
const User = require('../models/User');
const BannedHash = require('../models/BannedHash');
const StaffMemo = require('../models/StaffMemo');

/**
 * Get dashboard statistics and overview metrics
 */
async function getDashboardStats(req, res) {
  try {
    const now = new Date();

    const [
      totalIssues,
      unassignedCount,
      assignedStaffCount,
      assignedAdminCount,
      pendingReviewCount,
      postedCount,
      archivedCount,
      confusingCriticsCount,
      bannedCount,
      staffCount,
      pendingExtensionsCount,
      memosCount
    ] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'UNASSIGNED' }),
      Issue.countDocuments({ status: 'ASSIGNED_STAFF' }),
      Issue.countDocuments({ status: 'ASSIGNED_ADMIN' }),
      Issue.countDocuments({ status: 'PENDING_REVIEW' }),
      Issue.countDocuments({ status: 'POSTED' }),
      Issue.countDocuments({ status: 'ARCHIVED' }),
      Issue.countDocuments({ is_confusing_critic: true, status: { $ne: 'ARCHIVED' } }),
      BannedHash.countDocuments(),
      User.countDocuments({ role: 'STAFF' }),
      Issue.countDocuments({ extension_status: 'PENDING' }),
      StaffMemo.countDocuments()
    ]);

    // Urgent issues: UNASSIGNED and critical score >= 8
    const urgentCount = await Issue.countDocuments({
      status: 'UNASSIGNED',
      ai_critical_score: { $gte: 8 }
    });

    // Overdue tasks: ASSIGNED_STAFF and sla_deadline < now
    const overdueCount = await Issue.countDocuments({
      status: 'ASSIGNED_STAFF',
      sla_deadline: { $lt: now, $ne: null }
    });

    return res.json({
      success: true,
      stats: {
        total: totalIssues,
        unassigned: unassignedCount,
        assigned_staff: assignedStaffCount,
        assigned_admin: assignedAdminCount,
        pending_review: pendingReviewCount,
        posted: postedCount,
        archived: archivedCount,
        confusing_critics: confusingCriticsCount,
        urgent_high_priority: urgentCount,
        banned_students: bannedCount,
        active_staff: staffCount,
        overdue_tasks: overdueCount,
        pending_extensions: pendingExtensionsCount,
        total_memos_issued: memosCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get comprehensive analytics overview for date-wise issue view and reports
 * Validates requested date range (max 31 days)
 */
async function getAnalyticsOverview(req, res) {
  try {
    let { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    // Default to 14 days ago if not provided
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Normalize start to 00:00:00 and end to 23:59:59
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      return res.status(400).json({
        success: false,
        message: `Requested date range of ${diffDays} days exceeds the maximum permitted limit of 31 days.`
      });
    }

    if (diffDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date.'
      });
    }

    // Fetch issues created or resolved within or overlapping this window
    const issues = await Issue.find({
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { resolved_at: { $gte: start, $lte: end } }
      ]
    }).populate('assigned_to', 'name email role').lean();

    // 1. Build Date-Wise Daily Progress Breakdown
    const dayMap = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dayMap[key] = {
        date: key,
        display_date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        reported: 0,
        resolved: 0,
        unassigned: 0,
        assigned_staff: 0,
        pending_review: 0,
        overdue: 0
      };
    }

    const now = new Date();
    let totalResolvedInPeriod = 0;
    let totalResolutionHours = 0;
    let resolvedCountWithTime = 0;
    let onTimeCount = 0;

    issues.forEach(issue => {
      const createdKey = issue.createdAt ? new Date(issue.createdAt).toISOString().split('T')[0] : null;
      const resolvedKey = issue.resolved_at ? new Date(issue.resolved_at).toISOString().split('T')[0] : null;

      if (createdKey && dayMap[createdKey]) {
        dayMap[createdKey].reported += 1;
        if (issue.status === 'UNASSIGNED') dayMap[createdKey].unassigned += 1;
        if (issue.status === 'ASSIGNED_STAFF') dayMap[createdKey].assigned_staff += 1;
        if (issue.status === 'PENDING_REVIEW') dayMap[createdKey].pending_review += 1;
        if (issue.sla_deadline && new Date(issue.sla_deadline) < now && issue.status === 'ASSIGNED_STAFF') {
          dayMap[createdKey].overdue += 1;
        }
      }

      if (resolvedKey && dayMap[resolvedKey]) {
        dayMap[resolvedKey].resolved += 1;
        totalResolvedInPeriod += 1;
      }

      // Calculate resolution time and SLA compliance
      if (issue.resolved_at && issue.createdAt) {
        const hours = (new Date(issue.resolved_at) - new Date(issue.createdAt)) / (1000 * 60 * 60);
        totalResolutionHours += hours;
        resolvedCountWithTime += 1;

        if (issue.sla_deadline && new Date(issue.resolved_at) <= new Date(issue.sla_deadline)) {
          onTimeCount += 1;
        } else if (!issue.sla_deadline) {
          onTimeCount += 1;
        }
      }
    });

    const dateWiseTimeline = Object.values(dayMap);

    // 2. Category Distribution
    const categoryCounts = {};
    issues.forEach(i => {
      const cat = i.category || i.ai_issue_type || 'other concerns';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // 3. Block Hotspots
    const blockCounts = {};
    issues.forEach(i => {
      const block = i.block_name || (i.zone ? i.zone.split('-')[0].trim() : 'General Campus');
      blockCounts[block] = (blockCounts[block] || 0) + 1;
    });

    // 4. Progress Pipeline Classification
    const progressClassification = {
      reported: issues.filter(i => i.status === 'UNASSIGNED').length,
      in_action: issues.filter(i => i.status === 'ASSIGNED_STAFF' || i.status === 'ASSIGNED_ADMIN').length,
      under_review: issues.filter(i => i.status === 'PENDING_REVIEW').length,
      resolved: issues.filter(i => i.status === 'POSTED').length,
      archived: issues.filter(i => i.status === 'ARCHIVED').length
    };

    // 5. Overall Metrics
    const avgResolutionTimeHours = resolvedCountWithTime > 0 
      ? Math.round((totalResolutionHours / resolvedCountWithTime) * 10) / 10 
      : 0;
    const slaComplianceRate = resolvedCountWithTime > 0 
      ? Math.round((onTimeCount / resolvedCountWithTime) * 100) 
      : 100;

    const overdueCount = issues.filter(i => 
      i.status === 'ASSIGNED_STAFF' && i.sla_deadline && new Date(i.sla_deadline) < now
    ).length;

    const pendingExtensionsCount = issues.filter(i => i.extension_status === 'PENDING').length;
    const approvedExtensionsCount = issues.filter(i => i.extension_status === 'APPROVED').length;

    return res.json({
      success: true,
      period: {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        days_count: diffDays
      },
      summary: {
        total_incidents: issues.length,
        total_resolved: totalResolvedInPeriod,
        avg_resolution_time_hours: avgResolutionTimeHours,
        sla_compliance_rate: slaComplianceRate,
        overdue_incidents: overdueCount,
        pending_extensions: pendingExtensionsCount,
        approved_extensions: approvedExtensionsCount
      },
      date_wise_timeline: dateWiseTimeline,
      progress_classification: progressClassification,
      category_breakdown: categoryCounts,
      block_hotspots: blockCounts
    });

  } catch (error) {
    console.error('[Analytics Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Push Resolution Message directly to the reporting student
 * Replaces community feed push with direct student dispatch
 */
async function pushResolutionToStudent(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const issue = await Issue.findById(id).populate('assigned_to', 'name role');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const defaultMsg = `Your reported campus grievance regarding "${issue.ai_issue_type}" at ${issue.zone} has been officially resolved and verified by campus administration.`;
    
    issue.resolution_push_message = message && message.trim() ? message.trim() : defaultMsg;
    issue.resolution_notified_to_student = true;
    issue.resolution_pushed_at = new Date();
    // Also ensure issue is marked as POSTED / RESOLVED if in review
    if (issue.status === 'PENDING_REVIEW') {
      issue.status = 'POSTED';
      issue.reviewed_at = new Date();
    }

    await issue.save();

    return res.json({
      success: true,
      message: 'Resolution update successfully pushed to the reporting student.',
      issue
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Review Staff SLA Extension Request (Admin: APPROVE | REJECT)
 */
async function reviewStaffExtension(req, res) {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // action: 'APPROVE' | 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be APPROVE or REJECT'
      });
    }

    const issue = await Issue.findById(id).populate('assigned_to', 'name role email');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (!issue.extension_requested || issue.extension_status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending extension request found for this issue.'
      });
    }

    issue.extension_reviewed_at = new Date();

    if (action === 'APPROVE') {
      issue.extension_status = 'APPROVED';
      const daysToAdd = issue.extension_days || 1;
      const currentDeadline = issue.sla_deadline ? new Date(issue.sla_deadline) : new Date();
      issue.sla_deadline = new Date(currentDeadline.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      issue.extension_status = 'REJECTED';
    }

    await issue.save();

    return res.json({
      success: true,
      message: `Staff extension request has been ${action === 'APPROVE' ? 'approved' : 'rejected'}.`,
      issue
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Create an official staff memorandum for overdue tasks
 */
async function createStaffMemo(req, res) {
  try {
    const { staff_id, issue_id, subject, reason, action_required, warning_level } = req.body;

    const staffUser = await User.findById(staff_id);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Designated staff user not found' });
    }

    const targetIssue = await Issue.findById(issue_id);
    if (!targetIssue) {
      return res.status(404).json({ success: false, message: 'Referenced issue not found' });
    }

    const now = new Date();
    let daysOverdue = 1;
    if (targetIssue.sla_deadline) {
      const diffMs = now - new Date(targetIssue.sla_deadline);
      daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Generate formal sequential memo number
    const memoCount = await StaffMemo.countDocuments();
    const currentYear = new Date().getFullYear();
    const memo_number = `CARE/MEMO/${currentYear}/${String(memoCount + 1).padStart(3, '0')}`;

    const newMemo = new StaffMemo({
      memo_number,
      staff_id: staffUser._id,
      staff_name: staffUser.name,
      staff_email: staffUser.email,
      issue_id: targetIssue._id,
      zone: targetIssue.zone,
      category: targetIssue.category || targetIssue.ai_issue_type,
      days_overdue: daysOverdue,
      subject: subject || `SHOW-CAUSE MEMO: Non-completion of campus grievance within SLA (${targetIssue.zone})`,
      reason: reason || `Designated staff failed to resolve or provide resolution proof for grievance ${targetIssue._id} within the stipulated SLA deadline.`,
      action_required: action_required || 'Submit written cause within 48 hours and resolve the pending grievance with live proof.',
      warning_level: warning_level || 'FIRST_WARNING',
      issued_by: req.user.email || 'Office of Campus Administration'
    });

    await newMemo.save();

    return res.status(201).json({
      success: true,
      message: 'Staff memorandum issued successfully.',
      memo: newMemo
    });
  } catch (error) {
    console.error('[Create Memo Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get list of all issued staff memoranda
 */
async function getStaffMemos(req, res) {
  try {
    const memos = await StaffMemo.find()
      .sort({ createdAt: -1 })
      .populate('staff_id', 'name email role')
      .populate('issue_id', 'zone ai_issue_type ai_critical_score sla_deadline')
      .lean();

    return res.json({
      success: true,
      count: memos.length,
      memos
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * View UNASSIGNED issues sorted by ai_critical_score (High to Low)
 */
async function getUnassignedIssues(req, res) {
  try {
    const issues = await Issue.find({ status: 'UNASSIGNED' })
      .sort({ ai_critical_score: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * View "Confusing Critics" panel for AI-flagged edge cases
 */
async function getConfusingCritics(req, res) {
  try {
    const issues = await Issue.find({ is_confusing_critic: true })
      .sort({ createdAt: -1 })
      .populate('assigned_to', 'name role email')
      .lean();

    return res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * View issues in PENDING_REVIEW status for Before/After verification
 */
async function getPendingReviewIssues(req, res) {
  try {
    const issues = await Issue.find({ status: 'PENDING_REVIEW' })
      .sort({ resolved_at: -1, updatedAt: -1 })
      .populate('assigned_to', 'name role email')
      .lean();

    return res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Assign an issue to Staff member or Admin (Self)
 * Status changes to ASSIGNED_STAFF or ASSIGNED_ADMIN
 */
async function assignIssue(req, res) {
  try {
    const { id } = req.params;
    const { assign_type, staff_id, custom_sla_hours } = req.body; // assign_type: 'STAFF' | 'ADMIN'

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (assign_type === 'STAFF') {
      if (!staff_id) {
        return res.status(400).json({ success: false, message: 'staff_id is required for staff assignment' });
      }
      const staffUser = await User.findOne({ _id: staff_id, role: 'STAFF' });
      if (!staffUser) {
        return res.status(404).json({ success: false, message: 'Designated staff user not found' });
      }

      issue.status = 'ASSIGNED_STAFF';
      issue.assigned_to = staffUser._id;
    } else if (assign_type === 'ADMIN') {
      issue.status = 'ASSIGNED_ADMIN';
      issue.assigned_to = req.user.userId;
    } else {
      return res.status(400).json({ success: false, message: 'assign_type must be STAFF or ADMIN' });
    }

    // Set or refresh SLA deadline upon assignment
    const slaHours = custom_sla_hours ? Number(custom_sla_hours) : (issue.sla_hours || 48);
    issue.sla_hours = slaHours;
    issue.sla_deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    await issue.save();
    const populated = await Issue.findById(id).populate('assigned_to', 'name role email');

    return res.json({
      success: true,
      message: `Issue successfully assigned to ${assign_type} with ${slaHours}h SLA deadline.`,
      issue: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Review PENDING_REVIEW issue: Mark as POSTED or ARCHIVED
 */
async function reviewIssue(req, res) {
  try {
    const { id } = req.params;
    const { action, push_message } = req.body; // 'POST' or 'ARCHIVE'

    if (!['POST', 'ARCHIVE'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Action must be POST (publish/resolve) or ARCHIVE (reject/archive)' 
      });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.status = action === 'POST' ? 'POSTED' : 'ARCHIVED';
    issue.reviewed_at = new Date();

    // If approved, also configure direct student push message
    if (action === 'POST') {
      issue.resolution_notified_to_student = true;
      issue.resolution_push_message = push_message || `Your reported campus grievance at ${issue.zone} has been verified and resolved.`;
      issue.resolution_pushed_at = new Date();
    }

    await issue.save();

    const populated = await Issue.findById(id).populate('assigned_to', 'name role email');

    return res.json({
      success: true,
      message: `Issue marked as ${issue.status} and notification updated.`,
      issue: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Manual override for AI issue classification or severity
 */
async function updateIssueAiData(req, res) {
  try {
    const { id } = req.params;
    const { ai_issue_type, ai_critical_score, is_confusing_critic, category } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (ai_issue_type !== undefined) issue.ai_issue_type = ai_issue_type;
    if (category !== undefined) issue.category = category;
    if (ai_critical_score !== undefined) issue.ai_critical_score = Number(ai_critical_score);
    if (is_confusing_critic !== undefined) issue.is_confusing_critic = Boolean(is_confusing_critic);

    await issue.save();
    return res.json({ success: true, message: 'Issue details updated', issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Spam Control: Blacklist a hashed_student_id
 */
async function blacklistStudent(req, res) {
  try {
    const { hashed_student_id, reason, issue_id } = req.body;

    let hashToBan = hashed_student_id;

    if (issue_id && !hashToBan) {
      const targetIssue = await Issue.findById(issue_id);
      if (targetIssue) {
        hashToBan = targetIssue.reporter_hash;
        targetIssue.status = 'ARCHIVED';
        await targetIssue.save();
      }
    }

    if (!hashToBan) {
      return res.status(400).json({
        success: false,
        message: 'hashed_student_id or valid issue_id is required to ban.'
      });
    }

    const existingBan = await BannedHash.findOne({ hashed_student_id: hashToBan });
    if (existingBan) {
      return res.status(400).json({
        success: false,
        message: 'This student hash is already in the blacklist.'
      });
    }

    const newBan = new BannedHash({
      hashed_student_id: hashToBan,
      reason: reason || 'Flagged for spam submission or terms violation',
      banned_by: req.user.email || 'ADMIN'
    });

    await newBan.save();

    return res.status(201).json({
      success: true,
      message: 'Student anonymous hash blacklisted successfully.',
      ban: newBan
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get list of banned hashes
 */
async function getBlacklist(req, res) {
  try {
    const bans = await BannedHash.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: bans.length, bans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Remove a hash from the blacklist (Unban)
 */
async function unbanStudent(req, res) {
  try {
    const { hash } = req.params;
    const deleted = await BannedHash.findOneAndDelete({ hashed_student_id: hash });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Banned hash not found' });
    }
    return res.json({ success: true, message: 'Student hash reinstated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get list of all staff members with complete task ledger, SLA status and memos
 */
async function getStaffList(req, res) {
  try {
    const staff = await User.find({ role: 'STAFF' }).select('name email role createdAt').lean();
    const now = new Date();
    
    const staffWithWorkload = await Promise.all(
      staff.map(async (s) => {
        const tasks = await Issue.find({ assigned_to: s._id })
          .sort({ createdAt: -1 })
          .select('_id ai_issue_type category original_image_url resolution_image_url resolution_notes zone status ai_critical_score sla_deadline sla_hours sla_severity extension_requested extension_days extension_reason extension_status createdAt resolved_at reviewed_at')
          .lean();

        const inProgress = tasks.filter(t => t.status === 'ASSIGNED_STAFF').length;
        const pendingReview = tasks.filter(t => t.status === 'PENDING_REVIEW').length;
        const resolved = tasks.filter(t => t.status === 'POSTED' || t.status === 'ARCHIVED').length;
        const overdue = tasks.filter(t => t.status === 'ASSIGNED_STAFF' && t.sla_deadline && new Date(t.sla_deadline) < now).length;
        const pendingExtensions = tasks.filter(t => t.extension_status === 'PENDING').length;

        // Fetch memos count for this staff member
        const memosCount = await StaffMemo.countDocuments({ staff_id: s._id });

        return {
          ...s,
          active_tasks: inProgress,
          pending_review_tasks: pendingReview,
          resolved_tasks: resolved,
          overdue_tasks: overdue,
          pending_extensions: pendingExtensions,
          memos_issued: memosCount,
          total_assigned: tasks.length,
          tasks
        };
      })
    );

    return res.json({ success: true, staff: staffWithWorkload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get all issues with filtering
 */
async function getAllIssues(req, res) {
  try {
    const { status, zone, search, category } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (zone && zone !== 'ALL') {
      filter.zone = new RegExp(zone, 'i');
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { zone: new RegExp(search, 'i') },
        { block_name: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { ai_issue_type: new RegExp(search, 'i') },
        { student_description: new RegExp(search, 'i') }
      ];
    }

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .populate('assigned_to', 'name email role')
      .lean();

    return res.json({ success: true, count: issues.length, issues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin Self-Resolve (Complete Issue Directly)
 */
async function resolveAdminIssue(req, res) {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (issue.status !== 'ASSIGNED_ADMIN') {
      return res.status(400).json({ success: false, message: 'Issue is not assigned to admin' });
    }

    if (req.file) {
      issue.resolution_image_url = `/uploads/${req.file.filename}`;
    }
    
    issue.resolution_notes = resolution_notes || 'Resolved directly by Admin.';
    issue.status = 'POSTED';
    issue.resolved_at = new Date();
    issue.reviewed_at = new Date();

    await issue.save();

    const populated = await Issue.findById(id).populate('assigned_to', 'name role email');

    return res.json({
      success: true,
      message: 'Issue successfully resolved and completed by Admin.',
      issue: populated
    });
  } catch (error) {
    console.error('[Admin Resolve Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Add a Staff User
 */
async function addStaff(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      role: 'STAFF'
    });

    return res.json({ success: true, message: 'Staff member added successfully.', staff: newStaff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
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
};
