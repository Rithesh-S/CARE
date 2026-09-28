import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import client from '../api/client';

export const BanModal = ({ issue, onClose, onBanned }) => {
  const [reason, setReason] = useState('Repeated spam / malicious fake grievance submissions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!issue) return null;

  const handleBan = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await client.post('/api/admin/blacklist', {
        hashed_student_id: issue.reporter_hash,
        reason: reason.trim(),
        issue_id: issue._id
      });

      if (res.data.success) {
        onBanned(issue.reporter_hash);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to blacklist student hash');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', padding: '26px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Flag & Blacklist Reporter
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Enforces permanent 403 suspension on anonymous hash
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {/* Warning Alert */}
        <div style={{
          padding: '14px',
          borderRadius: '10px',
          background: '#fef2f2',
          border: '1.5px solid #fecdd3',
          marginBottom: '18px',
          display: 'flex',
          gap: '12px'
        }}>
          <AlertTriangle size={20} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.825rem', color: '#9f1239', lineHeight: '1.5' }}>
            <strong>Security Notice:</strong> You are about to ban HMAC Identifier:
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              background: '#ffffff',
              border: '1px solid #fecdd3',
              padding: '6px 8px',
              borderRadius: '6px',
              marginTop: '6px',
              wordBreak: 'break-all',
              color: '#be123c',
              fontWeight: 600
            }}>
              {issue.reporter_hash || 'ANONYMOUS_HMAC_HASH'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Permanent Suspension Reason
          </label>
          <textarea
            rows={3}
            className="search-input"
            style={{ paddingLeft: '14px', resize: 'vertical' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            className="btn btn-danger"
            onClick={handleBan}
          >
            {loading ? 'Processing Ban...' : 'Enact Blacklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
