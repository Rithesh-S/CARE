import React, { useState } from 'react';
import { FileText, AlertTriangle, Download, X, ShieldAlert, User, MapPin } from 'lucide-react';
import client from '../api/client';
import { generateStaffMemoPdf } from '../utils/memoPdfGenerator';

export const MemoModal = ({ staff, issue, onClose, onMemoIssued }) => {
  const [subject, setSubject] = useState(
    `OFFICIAL SHOW-CAUSE NOTICE: Non-compliance with SLA deadline for campus grievance (${issue?.zone || 'Campus Block'})`
  );
  const [warningLevel, setWarningLevel] = useState('SHOW_CAUSE');
  const [reason, setReason] = useState(
    `Designated staff officer hesitated and failed to inspect or resolve the assigned grievance (${issue?._id || 'N/A'}) within the stipulated SLA timeframe without approved extension.`
  );
  const [actionRequired, setActionRequired] = useState(
    'Submit a formal written explanation to campus administration within 48 hours and resolve the pending grievance with live photographic verification on urgent priority.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  let daysOverdue = 1;
  if (issue?.sla_deadline) {
    const diffMs = now - new Date(issue.sla_deadline);
    daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const handleIssueAndDownload = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !reason.trim()) {
      setError('Subject and reason are mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await client.post('/api/admin/memos', {
        staff_id: staff._id,
        issue_id: issue._id,
        subject: subject.trim(),
        reason: reason.trim(),
        action_required: actionRequired.trim(),
        warning_level: warningLevel
      });

      if (res.data.success) {
        // Trigger automatic PDF generation & download
        generateStaffMemoPdf({
          ...res.data.memo,
          zone: issue.zone,
          category: issue.category || issue.ai_issue_type
        });

        if (onMemoIssued) onMemoIssued(res.data.memo);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue memorandum.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1.5px solid #fecdd3'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff1f2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9f1239' }}>
                Issue Official Staff Memo (PDF)
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#be123c' }}>
                Formal administrative notice for SLA breach and delayed resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9f1239',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleIssueAndDownload} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              fontSize: '0.825rem'
            }}>
              {error}
            </div>
          )}

          {/* Recipient & Incident Context Info Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.825rem'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Target Staff Member
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{staff?.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>{staff?.email}</div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecdd3',
              fontSize: '0.825rem'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', marginBottom: '4px' }}>
                Breach Status • Overdue
              </div>
              <div style={{ fontWeight: 800, color: '#be123c' }}>
                {daysOverdue} Day(s) Overdue
              </div>
              <div style={{ color: '#9f1239', fontSize: '0.76rem' }}>
                Zone: {issue?.zone || 'Campus'}
              </div>
            </div>
          </div>

          {/* Warning Level Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Memo Escalation Level:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'FIRST_WARNING', label: 'First Warning Notice' },
                { id: 'SHOW_CAUSE', label: 'Show-Cause Memorandum' },
                { id: 'FINAL_NOTICE', label: 'Final Inquiry Notice' }
              ].map(lvl => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setWarningLevel(lvl.id)}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: warningLevel === lvl.id ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
                    background: warningLevel === lvl.id ? '#fef2f2' : '#ffffff',
                    color: warningLevel === lvl.id ? '#be123c' : 'var(--text-secondary)'
                  }}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Memorandum Subject:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Statement of Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Reason for Administrative Notice:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 12px', fontSize: '0.825rem', resize: 'vertical' }}
            />
          </div>

          {/* Action Required */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Prescribed Corrective Action & Reply Deadline:
            </label>
            <textarea
              rows={2}
              value={actionRequired}
              onChange={(e) => setActionRequired(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 12px', fontSize: '0.825rem', resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ background: '#e11d48', borderColor: '#e11d48' }}
            >
              <Download size={16} />
              {isSubmitting ? 'Generating Official Memo...' : 'Issue & Download PDF Memo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
