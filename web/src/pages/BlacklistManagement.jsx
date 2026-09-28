import React, { useState } from 'react';
import { ShieldAlert, Trash2, Plus, Calendar, ShieldCheck, X } from 'lucide-react';
import client from '../api/client';

export const BlacklistManagement = ({ blacklist, onRefresh, showToast }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHash, setNewHash] = useState('');
  const [newReason, setNewReason] = useState('Flagged for abusive or spam submissions');
  const [loading, setLoading] = useState(false);

  const handleUnban = async (hash) => {
    if (!window.confirm(`Are you sure you want to lift the suspension for this student hash?`)) return;

    try {
      const res = await client.delete(`/api/admin/blacklist/${hash}`);
      if (res.data.success) {
        showToast('Student hash successfully reinstated.', 'success');
        onRefresh();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to unban hash', 'error');
    }
  };

  const handleAddBan = async (e) => {
    e.preventDefault();
    if (!newHash.trim()) return;

    setLoading(true);
    try {
      const res = await client.post('/api/admin/blacklist', {
        hashed_student_id: newHash.trim(),
        reason: newReason.trim()
      });

      if (res.data.success) {
        showToast('Student hash added to permanent blacklist.', 'success');
        setShowAddModal(false);
        setNewHash('');
        onRefresh();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to ban student hash', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Spam Blacklist & Abuse Registry
            </h2>
            <span className="badge badge-status-unassigned">
              {blacklist.length} Banned Hashes
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            HMAC cryptographic hashes blocked from creating grievances or issuing authentication tokens.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-danger"
        >
          <Plus size={16} /> Manually Blacklist Hash
        </button>
      </div>

      {/* Security Architecture Info Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px', background: '#fef2f2', border: '1.5px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShieldCheck size={26} color="#059669" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.825rem', color: '#9f1239', lineHeight: '1.45' }}>
          <strong style={{ color: '#881337' }}>Privacy Preserving Spam Control:</strong> Students remain completely anonymous while rogue bad actors are tracked solely by their immutable HMAC-SHA256 fingerprint. Any banned student attempting to submit receives a strict <code>403 BANNED_STUDENT_HASH</code> response.
        </div>
      </div>

      {/* Blacklist Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', background: '#ffffff' }}>
        {blacklist.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No student hashes currently blacklisted.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hashed Anonymous Identifier</th>
                  <th>Violation Reason</th>
                  <th>Banned By</th>
                  <th>Date Enacted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blacklist.map((entry) => (
                  <tr key={entry._id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#e11d48', background: '#fef2f2', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #fecdd3' }}>
                        {entry.hashed_student_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {entry.reason}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#4338ca', fontSize: '0.85rem' }}>
                        {entry.banned_by?.name || 'Administrator'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(entry.banned_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleUnban(entry.hashed_student_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#e11d48' }}
                      >
                        <Trash2 size={13} /> Reinstate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Ban Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#e11d48" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Blacklist Student Hash
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  HMAC SHA-256 Student Hash
                </label>
                <input
                  type="text"
                  required
                  className="search-input"
                  style={{ paddingLeft: '14px', fontFamily: 'monospace' }}
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                  value={newHash}
                  onChange={(e) => setNewHash(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Suspension Reason
                </label>
                <textarea
                  required
                  rows={3}
                  className="search-input"
                  style={{ paddingLeft: '14px', resize: 'vertical' }}
                  placeholder="Specify violation (e.g. multiple fake image uploads)"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? 'Processing...' : 'Enforce Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
