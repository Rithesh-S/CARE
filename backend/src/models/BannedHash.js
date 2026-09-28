const mongoose = require('mongoose');

const BannedHashSchema = new mongoose.Schema({
  hashed_student_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  reason: {
    type: String,
    default: 'Flagged for spam / abusive content / policy violation'
  },
  banned_by: {
    type: String,
    default: 'ADMIN'
  }
}, { timestamps: true });

module.exports = mongoose.model('BannedHash', BannedHashSchema);
