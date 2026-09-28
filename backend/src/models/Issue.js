const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  reporter_hash: { 
    type: String, 
    required: true,
    index: true 
  },
  submission_type: {
    type: String,
    enum: ['PHOTO', 'TEXT'],
    default: 'PHOTO',
    index: true
  },
  category: {
    type: String,
    enum: [
      'safety and security',
      'drug related issue',
      'harassment and discrimination',
      'ragging and bullying',
      'academic issues',
      'data privacy issues',
      'facilities and welfare issues',
      'other concerns',
      'general_incident',
      'water_stagnation',
      'electrical_hazard',
      'garbage',
      'broken_furniture',
      'unclassified'
    ],
    default: 'other concerns',
    index: true
  },
  location_method: { 
    type: String, 
    enum: ['QR', 'MANUAL'], 
    required: true 
  },
  block_name: {
    type: String,
    default: "",
    index: true
  },
  zone: { 
    type: String, 
    required: true,
    index: true 
  },
  original_image_url: { 
    type: String, 
    default: "" 
  }, // Local path (e.g., /uploads/img1.jpg)
  student_description: { 
    type: String, 
    default: "" 
  },
  ai_issue_type: { 
    type: String, 
    required: true 
  },
  ai_predicted_classes: {
    type: [String],
    default: []
  },
  ai_caption: {
    type: String,
    default: ""
  },
  ai_critical_score: { 
    type: Number, 
    required: true,
    min: 1,
    max: 10,
    index: true 
  },
  is_confusing_critic: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['UNASSIGNED', 'ASSIGNED_STAFF', 'ASSIGNED_ADMIN', 'PENDING_REVIEW', 'ARCHIVED', 'POSTED'], 
    default: 'UNASSIGNED',
    index: true 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  // SLA Management
  sla_deadline: {
    type: Date,
    default: null,
    index: true
  },
  sla_hours: {
    type: Number,
    default: 48
  },
  sla_severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  // Staff SLA Extension Request Flow
  extension_requested: {
    type: Boolean,
    default: false,
    index: true
  },
  extension_days: {
    type: Number,
    default: 0
  },
  extension_reason: {
    type: String,
    default: ""
  },
  extension_status: {
    type: String,
    enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NONE',
    index: true
  },
  extension_requested_at: {
    type: Date,
    default: null
  },
  extension_reviewed_at: {
    type: Date,
    default: null
  },
  // Resolution & Direct Push Notification
  resolution_image_url: { 
    type: String, 
    default: null 
  }, // Local path
  resolution_notes: {
    type: String,
    default: ""
  },
  resolved_at: {
    type: Date,
    default: null
  },
  reviewed_at: {
    type: Date,
    default: null
  },
  resolution_push_message: {
    type: String,
    default: ""
  },
  resolution_notified_to_student: {
    type: Boolean,
    default: false,
    index: true
  },
  resolution_pushed_at: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Issue', IssueSchema);
