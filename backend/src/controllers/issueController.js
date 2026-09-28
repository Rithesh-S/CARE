const Issue = require('../models/Issue');
const { analyzeImage } = require('../services/aiMock');

// Category-based baseline severity and SLA hours for textual submissions
const CATEGORY_RULES = {
  'safety and security': { score: 9, hours: 24, severity: 'CRITICAL' },
  'drug related issue': { score: 9, hours: 24, severity: 'CRITICAL' },
  'harassment and discrimination': { score: 10, hours: 24, severity: 'CRITICAL' },
  'ragging and bullying': { score: 10, hours: 24, severity: 'CRITICAL' },
  'academic issues': { score: 5, hours: 72, severity: 'LOW' },
  'data privacy issues': { score: 7, hours: 48, severity: 'HIGH' },
  'facilities and welfare issues': { score: 6, hours: 48, severity: 'MEDIUM' },
  'other concerns': { score: 4, hours: 72, severity: 'LOW' }
};

/**
 * Calculates SLA deadline date from SLA hours
 */
function calculateSlaDeadline(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Submit a grievance report (Student)
 * Supports both:
 * 1. Live Camera Photo Flow (Analyzed by ML VLM Engine)
 * 2. Textual Issue Raise (Categorized via designated CARE campus categories)
 * Strictly limits total submissions per student to 3.
 */
async function submitIssue(req, res) {
  try {
    const reporter_hash = req.user?.hashed_student_id;
    if (!reporter_hash) {
      return res.status(403).json({
        success: false,
        error: 'STUDENT_AUTH_REQUIRED',
        message: 'Only authenticated students with an anonymous hash may submit grievances.'
      });
    }

    // STRICT LIMIT: Max 3 submissions per student PER DAY
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingCount = await Issue.countDocuments({ 
      reporter_hash,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    if (existingCount >= 3) {
      return res.status(403).json({
        success: false,
        error: 'STUDENT_SUBMISSION_LIMIT_REACHED',
        message: 'Submission limit reached: Each student is permitted a maximum of 3 grievance reports.'
      });
    }

    const { 
      submission_type = 'PHOTO', 
      location_method, 
      block_name, 
      zone, 
      student_description,
      category 
    } = req.body;

    if (!location_method || !['QR', 'MANUAL'].includes(location_method)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_LOCATION_METHOD',
        message: 'Location method must be either "QR" or "MANUAL".'
      });
    }

    if (!zone || !zone.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ZONE_REQUIRED',
        message: 'Campus zone / location details must be specified.'
      });
    }

    let original_image_url = '';
    let ai_issue_type = '';
    let ai_predicted_classes = [];
    let ai_caption = '';
    let ai_critical_score = 5;
    let is_confusing_critic = false;
    let finalCategory = category || 'other concerns';
    let sla_hours = 48;
    let sla_severity = 'MEDIUM';
    let aiAnalysisResult = null;

    if (submission_type === 'TEXT') {
      // TEXTUAL ISSUE RAISE
      if (!student_description || student_description.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: 'DESCRIPTION_REQUIRED',
          message: 'A descriptive note of at least 5 characters is required for textual grievances.'
        });
      }

      // Match designated categories
      const normalizedCat = (category || 'other concerns').toLowerCase().trim();
      const matchedRule = CATEGORY_RULES[normalizedCat] || CATEGORY_RULES['other concerns'];

      finalCategory = Object.keys(CATEGORY_RULES).includes(normalizedCat) 
        ? normalizedCat 
        : 'other concerns';
      ai_issue_type = finalCategory;
      ai_critical_score = matchedRule.score;
      sla_hours = matchedRule.hours;
      sla_severity = matchedRule.severity;
      ai_caption = `Textual grievance logged under category: ${finalCategory}`;
      ai_predicted_classes = [finalCategory];

      // Optional image if uploaded, otherwise empty
      if (req.file) {
        original_image_url = `/uploads/${req.file.filename}`;
      }
    } else {
      // PHOTO SUBMISSION (ML FLOW)
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'IMAGE_REQUIRED',
          message: 'A live camera photo is required for image-based grievance submissions.'
        });
      }

      original_image_url = `/uploads/${req.file.filename}`;

      // Invoke AI VLM Analysis Engine
      const aiAnalysis = await analyzeImage({
        imagePath: req.file.path,
        description: student_description,
        zone: zone
      });

      aiAnalysisResult = aiAnalysis;
      ai_issue_type = aiAnalysis.ai_issue_type;
      ai_predicted_classes = aiAnalysis.ai_predicted_classes || [];
      ai_caption = aiAnalysis.ai_caption || '';
      ai_critical_score = aiAnalysis.ai_critical_score || 5;
      is_confusing_critic = aiAnalysis.is_confusing_critic || false;

      // SLA Assignment based on Severity
      if (ai_critical_score >= 8) {
        sla_hours = 24;
        sla_severity = 'CRITICAL';
      } else if (ai_critical_score >= 6) {
        sla_hours = 48;
        sla_severity = 'HIGH';
      } else {
        sla_hours = 72;
        sla_severity = 'MEDIUM';
      }

      // Map AI classes to known categories if appropriate
      if (category && Object.keys(CATEGORY_RULES).includes(category.toLowerCase())) {
        finalCategory = category.toLowerCase();
      } else if (ai_issue_type.includes('water') || ai_issue_type.includes('stagnation') || ai_issue_type.includes('hazard') || ai_issue_type.includes('furniture')) {
        finalCategory = 'facilities and welfare issues';
      }
    }

    const sla_deadline = calculateSlaDeadline(sla_hours);

    const newIssue = new Issue({
      reporter_hash,
      submission_type: submission_type === 'TEXT' ? 'TEXT' : 'PHOTO',
      category: finalCategory,
      location_method,
      block_name: block_name ? block_name.trim() : '',
      zone: zone.trim(),
      original_image_url,
      student_description: student_description ? student_description.trim() : '',
      ai_issue_type,
      ai_predicted_classes,
      ai_caption,
      ai_critical_score,
      is_confusing_critic,
      status: 'UNASSIGNED',
      sla_deadline,
      sla_hours,
      sla_severity
    });

    await newIssue.save();

    const remainingQuota = Math.max(0, 3 - (existingCount + 1));

    return res.status(201).json({
      success: true,
      message: 'Grievance successfully submitted and assigned SLA deadline.',
      issue: newIssue,
      remaining_quota: remainingQuota,
      total_allowed: 3,
      sla_info: {
        deadline: sla_deadline,
        hours: sla_hours,
        severity: sla_severity
      },
      ai_result: aiAnalysisResult ? {
        issue_type: aiAnalysisResult.ai_issue_type,
        predicted_classes: aiAnalysisResult.ai_predicted_classes || [],
        caption: aiAnalysisResult.ai_caption || '',
        critical_score: aiAnalysisResult.ai_critical_score,
        is_confusing_critic: aiAnalysisResult.is_confusing_critic,
        confidence: aiAnalysisResult.confidence,
        source: aiAnalysisResult.source || 'ai_service'
      } : null
    });

  } catch (error) {
    console.error('[Submit Issue Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'SUBMISSION_FAILED',
      message: error.message || 'Failed to submit grievance report.'
    });
  }
}

/**
 * Get submissions made by the currently authenticated student
 * Also returns student quota stats (used / 3)
 */
async function getMySubmissions(req, res) {
  try {
    const reporter_hash = req.user.hashed_student_id;
    if (!reporter_hash) {
      return res.status(400).json({
        success: false,
        error: 'STUDENT_HASH_REQUIRED',
        message: 'No student identifier associated with session.'
      });
    }

    const issues = await Issue.find({ reporter_hash })
      .sort({ createdAt: -1 })
      .populate('assigned_to', 'name role')
      .lean();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = issues.filter(i => {
      if (!i.createdAt) return false;
      const d = new Date(i.createdAt);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    const remainingQuota = Math.max(0, 3 - todayCount);
    const count = issues.length;

    return res.json({
      success: true,
      count,
      remaining_quota: remainingQuota,
      total_allowed: 3,
      issues
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get public feed of POSTED resolved grievances
 */
async function getPublicFeed(req, res) {
  try {
    const feed = await Issue.find({ status: 'POSTED' })
      .sort({ updatedAt: -1 })
      .populate('assigned_to', 'name role')
      .select('-reporter_hash')
      .lean();

    return res.json({
      success: true,
      count: feed.length,
      feed
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Get single issue details
 */
async function getIssueById(req, res) {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id).populate('assigned_to', 'name role email');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    return res.json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Dismiss an alert for a resolved issue (Student)
 */
async function dismissAlert(req, res) {
  try {
    const { id } = req.params;
    const reporter_hash = req.user.hashed_student_id;
    
    if (!reporter_hash) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    if (issue.reporter_hash !== reporter_hash) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this issue' });
    }

    // The student has seen it, clear it from the DB
    issue.resolution_push_message = "";
    await issue.save();

    return res.json({ success: true, message: 'Alert dismissed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  submitIssue,
  getMySubmissions,
  getPublicFeed,
  getIssueById,
  dismissAlert
};
