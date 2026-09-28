import React, { useState } from 'react';
import { Send, X, CheckCircle, Bell, MapPin, Tag } from 'lucide-react';
import client from '../api/client';

export const PushResolutionModal = ({ issue, onClose, onPushed }) => {
  const defaultMsg = `Your reported campus grievance regarding "${issue?.category || issue?.ai_issue_type}" at ${issue?.zone} has been inspected, resolved, and verified by campus facilities administration. Thank you for helping maintain campus standards!`;

  const [message, setMessage] = useState(defaultMsg);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePush = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await client.post(`/api/admin/issues/${issue._id}/push-resolution`, {
        message: message.trim()
      });

      if (res.data.success) {
        if (onPushed) onPushed(res.data.issue);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch resolution notification.');
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
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1.5px solid #a7f3d0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ecfdf5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
                Push Resolution Alert to Student
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#047857' }}>
                Directly notify the anonymous reporter of the verified resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handlePush} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          {/* Context Card */}
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {issue?.category || issue?.ai_issue_type}
              </span>
              <span className="badge badge-status-posted" style={{ fontSize: '0.68rem' }}>
                VERIFIED FIX
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <MapPin size={13} color="#0284c7" />
              <span>{issue?.zone}</span>
            </div>
            {issue?.resolution_notes && (
              <div style={{
                marginTop: '4px',
                padding: '6px 10px',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#065f46',
                fontSize: '0.78rem'
              }}>
                <strong>Staff Action:</strong> {issue.resolution_notes}
              </div>
            )}
          </div>

          {/* Custom Message Editor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Notification Message for Reporting Student:
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              This official notification will be dispatched exclusively to the student's personal report tracker.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
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
              className="btn btn-emerald"
            >
              <Send size={15} />
              {isSubmitting ? 'Dispatching...' : 'Push Direct Message to Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
