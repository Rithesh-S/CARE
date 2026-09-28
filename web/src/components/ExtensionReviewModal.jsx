import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react';
import client from '../api/client';

export const ExtensionReviewModal = ({ issue, onClose, onReviewed }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentDeadline = issue?.sla_deadline ? new Date(issue.sla_deadline) : new Date();
  const extensionDays = issue?.extension_days || 1;
  const newDeadline = new Date(currentDeadline.getTime() + extensionDays * 24 * 60 * 60 * 1000);

  const handleAction = async (action) => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await client.post(`/api/admin/issues/${issue._id}/review-extension`, {
        action
      });

      if (res.data.success) {
        if (onReviewed) onReviewed(res.data.issue);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review extension request.');
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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1.5px solid #fed7aa',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fffbeb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
                Review SLA Extension Request
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#b45309' }}>
                Staff formal request to extend grievance resolution deadline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400e', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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

          {/* Details Card */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Staff:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{issue?.assigned_to?.name || 'Assigned Officer'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Grievance Zone:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{issue?.zone}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Requested Extension:</span>
              <span className="badge badge-status-assigned" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                +{extensionDays} Day(s) Extension
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Current SLA Deadline:</span>
              <span style={{ color: '#be123c', fontWeight: 600 }}>
                {currentDeadline.toLocaleDateString()} {currentDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-medium)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>New SLA if Approved:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                {newDeadline.toLocaleDateString()} {newDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Reason Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Staff's Justification / Reason for Delay:
            </label>
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fed7aa',
              color: '#78350f',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              fontStyle: 'italic'
            }}>
              "{issue?.extension_reason || 'No specific reason provided.'}"
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('REJECT')}
              className="btn btn-danger"
              style={{ padding: '9px 16px' }}
            >
              <XCircle size={15} /> Reject Request
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('APPROVE')}
              className="btn btn-emerald"
              style={{ padding: '9px 18px' }}
            >
              <CheckCircle2 size={15} /> Approve +{extensionDays} Days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
