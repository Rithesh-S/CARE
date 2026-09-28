const crypto = require('crypto');

/**
 * Generate an irreversible HMAC-SHA256 hash for student email.
 * This guarantees student anonymity while allowing the system to track
 * repetitive submissions or enforce spam blacklisting without storing raw emails.
 *
 * @param {string} email - The student's institutional email address
 * @returns {string} - The hex-encoded HMAC-SHA256 hash
 */
function hashStudentEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email string is required for anonymization');
  }
  const secret = process.env.SERVER_SECRET || 'spillit_default_secret_salt_key_2026';
  const normalizedEmail = email.toLowerCase().trim();
  return crypto.createHmac('sha256', secret).update(normalizedEmail).digest('hex');
}

/**
 * Validate that an email belongs to the permitted institutional domain (@skcet.ac.in).
 *
 * @param {string} email
 * @returns {boolean}
 */
function isDomainPermitted(email) {
  if (!email || typeof email !== 'string') return false;
  const allowedDomain = (process.env.ALLOWED_DOMAIN || 'skcet.ac.in').toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();
  return normalizedEmail.endsWith(`@${allowedDomain}`);
}

module.exports = {
  hashStudentEmail,
  isDomainPermitted
};
