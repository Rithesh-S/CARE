const mongoose = require('mongoose');

const StaffMemoSchema = new mongoose.Schema({
  memo_number: {
    type: String,
    required: true,
    unique: true
  },
  staff_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staff_name: {
    type: String,
    required: true
  },
  staff_email: {
    type: String,
    required: true
  },
  issue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  zone: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: ""
  },
  days_overdue: {
    type: Number,
    required: true,
    default: 1
  },
  subject: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: "Failure to complete assigned campus grievance within stipulated SLA deadline."
  },
  action_required: {
    type: String,
    default: "Submit a written explanation within 48 hours and resolve the pending task on emergency priority."
  },
  warning_level: {
    type: String,
    enum: ['FIRST_WARNING', 'SHOW_CAUSE', 'FINAL_NOTICE'],
    default: 'FIRST_WARNING'
  },
  issued_by: {
    type: String,
    default: "Office of Campus Administration, Sri Krishna College of Engineering and Technology"
  },
  issued_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('StaffMemo', StaffMemoSchema);
