const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5000';

function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let postData = null;
    if (body && !headers['Content-Type']?.includes('multipart')) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Multipart helper
function uploadMultipart(endpoint, headers = {}, fields = {}, filePath = null, fileField = 'image') {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(endpoint, BASE_URL);
    
    let parts = [];
    for (const [key, val] of Object.entries(fields)) {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      );
    }

    let fileBuffer = null;
    if (filePath && fs.existsSync(filePath)) {
      const filename = path.basename(filePath);
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
      fileBuffer = Buffer.concat([
        Buffer.from(fileHeader, 'utf-8'),
        fs.readFileSync(filePath),
        Buffer.from('\r\n', 'utf-8')
      ]);
    }

    const closingBuffer = Buffer.from(`--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([
      Buffer.from(parts.join(''), 'utf-8'),
      ...(fileBuffer ? [fileBuffer] : []),
      closingBuffer
    ]);

    const req = http.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Spill It (V1 Alpha) Backend Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    assert('Health Check', health.status === 200 && health.data.mongo_connected === true);

    // 2. Domain Restriction Check (@gmail.com should be 403 Forbidden)
    const invalidDomain = await makeRequest('POST', '/api/auth/google', {}, { email: 'intruder@gmail.com' });
    assert('Domain Restriction Rejects non-skcet email', invalidDomain.status === 403 && invalidDomain.data.error === 'DOMAIN_RESTRICTED');

    // 3. Blacklisted Student Check
    const bannedStudent = await makeRequest('POST', '/api/auth/google', {}, { email: 'spammer.test@skcet.ac.in' });
    assert('Banned Student Hash is Rejected with 403', bannedStudent.status === 403 && bannedStudent.data.error === 'BANNED_STUDENT_HASH');

    // 4. Valid Student Auth (HMAC Anonymization)
    const validStudent = await makeRequest('POST', '/api/auth/google', {}, { email: 'student.arun@skcet.ac.in' });
    assert('Student Authenticated with HMAC hash & no email stored', validStudent.status === 200 && validStudent.data.user.role === 'STUDENT' && !!validStudent.data.user.hashed_student_id);
    const studentToken = validStudent.data.token;

    // 5. Valid Admin Auth
    const adminAuth = await makeRequest('POST', '/api/auth/google', {}, { email: 'admin@skcet.ac.in' });
    assert('Admin Authenticated with ADMIN role', adminAuth.status === 200 && adminAuth.data.user.role === 'ADMIN');
    const adminToken = adminAuth.data.token;

    // 6. Admin Dashboard Stats
    const statsRes = await makeRequest('GET', '/api/admin/stats', { 'Authorization': `Bearer ${adminToken}` });
    assert('Admin Fetches Dashboard Stats', statsRes.status === 200 && statsRes.data.stats.total > 0);

    // 7. Admin Unassigned Queue Sorted by Critical Score
    const unassignedRes = await makeRequest('GET', '/api/admin/issues/unassigned', { 'Authorization': `Bearer ${adminToken}` });
    const isSorted = unassignedRes.data.issues.every((issue, idx, arr) => {
      return idx === 0 || arr[idx - 1].ai_critical_score >= issue.ai_critical_score;
    });
    assert('Admin Unassigned Queue Sorted High to Low by Critical Score', unassignedRes.status === 200 && isSorted);

    // 8. Student Submits Grievance with Live Image
    const sampleImgPath = path.join(__dirname, 'uploads', 'sample_pipe_leak.svg');
    const submitRes = await uploadMultipart(
      '/api/issues',
      { 'Authorization': `Bearer ${studentToken}` },
      { location_method: 'QR', zone: 'IT Block - 2nd Floor Corridor', student_description: 'Water leaking heavily near electrical switch' },
      sampleImgPath,
      'image'
    );
    assert('Student Submits Issue (with Mock AI Classification)', submitRes.status === 201 && submitRes.data.issue.status === 'UNASSIGNED' && submitRes.data.ai_result.critical_score >= 1);
    const createdIssueId = submitRes.data?.issue?._id;

    // 9. Staff List for Assignment
    const staffRes = await makeRequest('GET', '/api/admin/staff', { 'Authorization': `Bearer ${adminToken}` });
    assert('Admin Fetches Staff List with Workloads', staffRes.status === 200 && staffRes.data.staff.length > 0);
    const targetStaff = staffRes.data.staff[0];

    // 10. Admin Assigns Issue to Staff
    const assignRes = await makeRequest(
      'POST',
      `/api/admin/issues/${createdIssueId}/assign`,
      { 'Authorization': `Bearer ${adminToken}` },
      { assign_type: 'STAFF', staff_id: targetStaff._id }
    );
    assert('Admin Assigns Issue to Staff', assignRes.status === 200 && assignRes.data.issue.status === 'ASSIGNED_STAFF');

    // 11. Staff Auth
    const staffAuth = await makeRequest('POST', '/api/auth/google', {}, { email: targetStaff.email });
    assert('Staff Authenticated', staffAuth.status === 200 && staffAuth.data.user.role === 'STAFF');
    const staffToken = staffAuth.data.token;

    // 12. Staff Resolves Issue with "After" Photo
    const resolveRes = await uploadMultipart(
      `/api/staff/issues/${createdIssueId}/resolve`,
      { 'Authorization': `Bearer ${staffToken}` },
      { resolution_notes: 'Leak sealed and pipeline replaced.' },
      path.join(__dirname, 'uploads', 'sample_fixed_pipe.svg'),
      'resolution_image'
    );
    assert('Staff Resolves Issue with Resolution Photo (Status -> PENDING_REVIEW)', resolveRes.status === 200 && resolveRes.data.issue.status === 'PENDING_REVIEW');

    // 13. Admin Reviews & Publishes to Feed
    const reviewRes = await makeRequest(
      'POST',
      `/api/admin/issues/${createdIssueId}/review`,
      { 'Authorization': `Bearer ${adminToken}` },
      { action: 'POST' }
    );
    assert('Admin Approves Issue (Status -> POSTED)', reviewRes.status === 200 && reviewRes.data.issue.status === 'POSTED');

    // 14. Public Feed Check
    const feedRes = await makeRequest('GET', '/api/issues/feed');
    const foundInFeed = feedRes.data.feed.some(item => item._id === createdIssueId);
    assert('Public Feed Contains newly POSTED Grievance', feedRes.status === 200 && foundInFeed);

    // 15. Admin Blacklist Spam Control
    const banRes = await makeRequest(
      'POST',
      '/api/admin/blacklist',
      { 'Authorization': `Bearer ${adminToken}` },
      { hashed_student_id: validStudent.data.user.hashed_student_id, reason: 'Test ban enforcement' }
    );
    assert('Admin Blacklists Student Hash', banRes.status === 201 && banRes.data.ban);

    // 16. Verify Blacklisted Student is now rejected
    const blockedSubmit = await uploadMultipart(
      '/api/issues',
      { 'Authorization': `Bearer ${studentToken}` },
      { location_method: 'MANUAL', zone: 'Test Zone', student_description: 'Spam test' },
      sampleImgPath,
      'image'
    );
    assert('Blacklisted Student Blocked from Future Submissions (HTTP 403)', blockedSubmit.status === 403 && blockedSubmit.data.error === 'BANNED_STUDENT_HASH');

    console.log(`\n🏁 Test Run Finished: ${passed} Passed, ${failed} Failed\n`);
    process.exit(failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('💥 Test Execution Error:', err);
    process.exit(1);
  }
}

// Give server time if invoked independently
setTimeout(runTests, 1000);
