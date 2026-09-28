const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Issue = require('./models/Issue');
const BannedHash = require('./models/BannedHash');
const StaffMemo = require('./models/StaffMemo');
const { hashStudentEmail } = require('./services/anonymizer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple SVG generator buffer helper
function createDummyImageBuffer(label = 'CARE Issue', color = '#1e293b') {
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="16" />
    <circle cx="400" cy="240" r="80" fill="rgba(255,255,255,0.08)" />
    <path d="M370 240 L390 270 L430 210" stroke="#38bdf8" stroke-width="8" fill="none" stroke-linecap="round"/>
    <text x="400" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="bold" fill="#f8fafc" text-anchor="middle">${label}</text>
    <text x="400" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">CARE • SKCET Campus Autonomous Reporting</text>
    <text x="400" y="465" font-family="monospace" font-size="14" fill="#64748b" text-anchor="middle">GEO-STAMP: 10.9368° N, 76.9560° E</text>
  </svg>`;
  return Buffer.from(svg, 'utf-8');
}

function saveSampleImage(filename, label, color) {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createDummyImageBuffer(label, color));
  }
  return `/uploads/${filename}`;
}

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spillit';
    console.log('[Seed] Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
      BannedHash.deleteMany({}),
      StaffMemo.deleteMany({})
    ]);

    // 1. Create Staff and Admin Users
    console.log('[Seed] Creating Staff and Admin accounts...');
    const admin = await User.create({
      name: 'Dr. S. K. Ramesh (Campus Admin)',
      email: 'admin@skcet.ac.in',
      role: 'ADMIN'
    });

    const staff1 = await User.create({
      name: 'M. Saravanan (Electrical & Facilities)',
      email: 'staff.saravanan@skcet.ac.in',
      role: 'STAFF'
    });

    const staff2 = await User.create({
      name: 'P. Priya (Civil & Maintenance)',
      email: 'staff.priya@skcet.ac.in',
      role: 'STAFF'
    });

    const staff3 = await User.create({
      name: 'K. Karthik (Sanitation & Housekeeping)',
      email: 'staff.karthik@skcet.ac.in',
      role: 'STAFF'
    });

    const generalStaff = await User.create({
      name: 'Staff Desk (Duty Officer)',
      email: 'staff@skcet.ac.in',
      role: 'STAFF'
    });

    // 2. Prepare Sample Images
    const imgPipe = saveSampleImage('sample_pipe_leak.svg', 'Severe Pipe Burst & Water Leak', '#0369a1');
    const imgWire = saveSampleImage('sample_exposed_wire.svg', 'Exposed High-Voltage Cable', '#b91c1c');
    const imgBench = saveSampleImage('sample_broken_bench.svg', 'Damaged Auditorium Seating', '#475569');
    const imgAc = saveSampleImage('sample_ac_fault.svg', 'AC Chiller Malfunction', '#4338ca');
    const imgRestroom = saveSampleImage('sample_restroom.svg', 'Restroom Sanitation Hazard', '#78350f');
    const imgEdge = saveSampleImage('sample_edge_case.svg', 'Ambiguous Ceiling Stains (Critic Flag)', '#6b21a8');
    
    const imgFixedPipe = saveSampleImage('sample_fixed_pipe.svg', 'Pipe Repaired & Pressure Tested (AFTER)', '#047857');
    const imgFixedBench = saveSampleImage('sample_fixed_bench.svg', 'Auditorium Bench Replaced (AFTER)', '#065f46');
    const imgFixedWire = saveSampleImage('sample_fixed_wire.svg', 'Cable Insulated & Box Sealed (AFTER)', '#047857');

    // 3. Create Sample Hashes
    const student1Hash = hashStudentEmail('student1@skcet.ac.in');
    const student2Hash = hashStudentEmail('student2@skcet.ac.in');
    const student3Hash = hashStudentEmail('student3@skcet.ac.in');
    const spamStudentHash = hashStudentEmail('spammer.test@skcet.ac.in');

    // 4. Seed Banned Hash for spam demonstration
    console.log('[Seed] Creating Banned student hash for spam test...');
    await BannedHash.create({
      hashed_student_id: spamStudentHash,
      reason: 'Repeated non-campus fake image uploads and spamming',
      banned_by: 'admin@skcet.ac.in'
    });

    // 5. Seed Issues across all states with SLA, blocks & categories
    console.log('[Seed] Seeding Issues across triage lifecycle...');

    const now = new Date();
    const deadline24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const deadline48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const overdueDeadline = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days overdue

    const createdIssues = await Issue.create([
      // 1. URGENT UNASSIGNED (Critical score 10 - Safety & Security)
      {
        reporter_hash: student1Hash,
        submission_type: 'PHOTO',
        category: 'safety and security',
        location_method: 'QR',
        block_name: 'Mechanical Block',
        zone: 'Mechanical Block - CNC & CAD/CAM Lab',
        original_image_url: imgWire,
        student_description: 'Live sparking wires hanging near the lathe machine station. Immediate hazard!',
        ai_issue_type: 'safety and security',
        ai_predicted_classes: ['electrical_hazard', 'exposed_wiring'],
        ai_caption: 'An image showing live exposed electrical wiring near machinery.',
        ai_critical_score: 10,
        is_confusing_critic: false,
        status: 'UNASSIGNED',
        sla_hours: 24,
        sla_severity: 'CRITICAL',
        sla_deadline: deadline24h
      },
      // 2. TEXTUAL ISSUE RAISE (Ragging & Bullying - Critical score 10)
      {
        reporter_hash: student2Hash,
        submission_type: 'TEXT',
        category: 'ragging and bullying',
        location_method: 'QR',
        block_name: 'Hostel Block',
        zone: 'Hostel Block - 2nd Floor Corridor',
        original_image_url: '',
        student_description: 'Group of senior students gathering late night near room 208 intimidating first year students.',
        ai_issue_type: 'ragging and bullying',
        ai_predicted_classes: ['ragging and bullying'],
        ai_caption: 'Textual grievance logged under category: ragging and bullying',
        ai_critical_score: 10,
        is_confusing_critic: false,
        status: 'UNASSIGNED',
        sla_hours: 24,
        sla_severity: 'CRITICAL',
        sla_deadline: deadline24h
      },
      // 3. URGENT UNASSIGNED (Critical score 9 - Facilities)
      {
        reporter_hash: student3Hash,
        submission_type: 'PHOTO',
        category: 'facilities and welfare issues',
        location_method: 'MANUAL',
        block_name: 'Central Library',
        zone: 'Central Library - Digital Resource Section',
        original_image_url: imgPipe,
        student_description: 'Main overhead water pipe leaking water directly over digital computer desks.',
        ai_issue_type: 'facilities and welfare issues',
        ai_predicted_classes: ['water_leakage', 'water_stagnation'],
        ai_caption: 'An image showing ceiling pipe burst with water leakage.',
        ai_critical_score: 9,
        is_confusing_critic: false,
        status: 'UNASSIGNED',
        sla_hours: 24,
        sla_severity: 'CRITICAL',
        sla_deadline: deadline24h
      },
      // 4. OVERDUE ASSIGNED_STAFF (Staff Hesitated / Breached Deadline)
      {
        reporter_hash: student1Hash,
        submission_type: 'PHOTO',
        category: 'facilities and welfare issues',
        location_method: 'QR',
        block_name: 'IT Block',
        zone: 'IT Block - 3rd Floor Lab 4',
        original_image_url: imgAc,
        student_description: 'Split AC is making loud buzzing noise and completely halted cooling.',
        ai_issue_type: 'facilities and welfare issues',
        ai_predicted_classes: ['ac_failure'],
        ai_caption: 'An image showing an unserviced HVAC ventilation unit.',
        ai_critical_score: 7,
        is_confusing_critic: false,
        status: 'ASSIGNED_STAFF',
        assigned_to: staff1._id,
        sla_hours: 48,
        sla_severity: 'HIGH',
        sla_deadline: overdueDeadline
      },
      // 5. EXTENSION REQUEST PENDING (Staff requested +2 days)
      {
        reporter_hash: student2Hash,
        submission_type: 'PHOTO',
        category: 'facilities and welfare issues',
        location_method: 'MANUAL',
        block_name: 'CSE Dept',
        zone: 'CSE Dept - Programming Lab 1',
        original_image_url: imgBench,
        student_description: 'Workstation power supply trip switch burnt out, cutting power to 12 terminals.',
        ai_issue_type: 'facilities and welfare issues',
        ai_predicted_classes: ['electrical_hazard'],
        ai_caption: 'Damaged power breaker switch box.',
        ai_critical_score: 6,
        is_confusing_critic: false,
        status: 'ASSIGNED_STAFF',
        assigned_to: staff2._id,
        sla_hours: 48,
        sla_severity: 'MEDIUM',
        sla_deadline: deadline48h,
        extension_requested: true,
        extension_days: 2,
        extension_reason: 'Awaiting specialized industrial 3-phase circuit breaker delivery from vendor warehouse.',
        extension_status: 'PENDING',
        extension_requested_at: new Date(now.getTime() - 1000 * 60 * 60 * 4)
      },
      // 6. PENDING_REVIEW (Resolution Submitted, Ready for Admin Sign-Off)
      {
        reporter_hash: student3Hash,
        submission_type: 'PHOTO',
        category: 'facilities and welfare issues',
        location_method: 'QR',
        block_name: 'Main Admin Block',
        zone: 'Main Admin Block - Examination Cell Corridor',
        original_image_url: imgBench,
        student_description: 'Broken bench wooden frame causing students to trip during exam entry.',
        ai_issue_type: 'facilities and welfare issues',
        ai_predicted_classes: ['broken_furniture'],
        ai_caption: 'An image showing broken corridor wooden seating.',
        ai_critical_score: 7,
        is_confusing_critic: false,
        status: 'PENDING_REVIEW',
        assigned_to: staff2._id,
        resolution_image_url: imgFixedBench,
        resolution_notes: 'Replaced wooden backrest and secured heavy-duty bolts. Safe for use.',
        resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        sla_hours: 48,
        sla_deadline: deadline48h
      },
      // 7. POSTED & RESOLUTION PUSHED TO STUDENT
      {
        reporter_hash: student1Hash,
        submission_type: 'PHOTO',
        category: 'safety and security',
        location_method: 'QR',
        block_name: 'ECE Block',
        zone: 'ECE Block - 1st Floor Corridor',
        original_image_url: imgWire,
        student_description: 'Loose junction box cover with exposed power wiring.',
        ai_issue_type: 'safety and security',
        ai_predicted_classes: ['electrical_hazard'],
        ai_caption: 'An image showing exposed junction box electrical hazard.',
        ai_critical_score: 9,
        is_confusing_critic: false,
        status: 'POSTED',
        assigned_to: staff1._id,
        resolution_image_url: imgFixedWire,
        resolution_notes: 'Installed heavy-duty PVC insulated casing and safety lock.',
        resolved_at: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        reviewed_at: new Date(now.getTime() - 1000 * 60 * 60 * 20),
        resolution_push_message: 'Your report regarding exposed power wiring at ECE Block 1st Floor has been inspected and permanently resolved with insulated safety enclosures. Thank you for helping keep our campus safe!',
        resolution_notified_to_student: true,
        resolution_pushed_at: new Date(now.getTime() - 1000 * 60 * 60 * 20),
        sla_hours: 24,
        sla_deadline: new Date(now.getTime() - 1000 * 60 * 60 * 20)
      }
    ]);

    // 6. Seed Sample Staff Memo for the overdue task
    console.log('[Seed] Creating initial Staff Memorandum for overdue task...');
    const overdueIssue = createdIssues[3]; // The AC fault overdue by 2 days
    await StaffMemo.create({
      memo_number: 'CARE/MEMO/2026/001',
      staff_id: staff1._id,
      staff_name: staff1.name,
      staff_email: staff1.email,
      issue_id: overdueIssue._id,
      zone: overdueIssue.zone,
      category: overdueIssue.category,
      days_overdue: 2,
      subject: 'SHOW-CAUSE NOTICE: Failure to resolve campus grievance within designated SLA',
      reason: 'Assigned electrical technician hesitated and failed to repair the reported HVAC unit within the mandated 48-hour SLA deadline without requesting an extension.',
      action_required: 'Submit formal written explanation to Dean of Administration within 48 hours and complete AC repair on urgent priority.',
      warning_level: 'SHOW_CAUSE',
      issued_by: 'Office of Campus Administration, Sri Krishna College of Engineering and Technology'
    });

    console.log('[Seed] CARE database successfully seeded!');
    console.log('--- Admin Account: admin@skcet.ac.in');
    console.log('--- Staff Account: staff@skcet.ac.in (and staff.saravanan@skcet.ac.in, staff.priya@skcet.ac.in)');
    console.log('--- Student Test: student@skcet.ac.in');
    console.log('--- Banned Student: spammer.test@skcet.ac.in');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

seed();
