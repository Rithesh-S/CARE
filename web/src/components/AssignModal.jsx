import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, AlertCircle, Check } from 'lucide-react';
import client from '../api/client';

export const AssignModal = ({ issue, onClose, onAssigned }) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignType, setAssignType] = useState('STAFF'); // 'STAFF' or 'ADMIN'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await client.get('/api/admin/staff');
      if (res.data.success) {
        setStaffList(res.data.staff);
        if (res.data.staff.length > 0) {
          setSelectedStaffId(res.data.staff[0]._id);
        }
      }
    } catch (err) {
      setError('Failed to fetch staff members list');
    }
  };

  const handleAssign = async () => {
    if (assignType === 'STAFF' && !selectedStaffId) {
      setError('Please select a staff member to assign');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await client.post(`/api/admin/issues/${issue._id}/assign`, {
        assign_type: assignType,
        staff_id: assignType === 'STAFF' ? selectedStaffId : undefined
      });

      if (res.data.success) {
        onAssigned(res.data.issue);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!issue) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '26px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4f46e5'
            }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Triage & Assign Incident
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zone: {issue.zone}
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
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Issue Summary Snapshot */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {issue.ai_issue_type}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Severity: <strong>{issue.ai_critical_score}/10</strong>
            </div>
          </div>
          <span className="badge badge-status-unassigned">UNASSIGNED</span>
        </div>

        {/* Assignment Type Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Assignment Path
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setAssignType('STAFF')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: assignType === 'STAFF' ? '2px solid #4f46e5' : '1px solid var(--border-subtle)',
                background: assignType === 'STAFF' ? '#eef2ff' : '#ffffff',
                color: assignType === 'STAFF' ? '#4338ca' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Field Specialist</span>
                {assignType === 'STAFF' && <Check size={16} color="#4f46e5" />}
              </div>
              <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>
                Dispatch task directly to on-ground staff officer.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAssignType('ADMIN')}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: assignType === 'ADMIN' ? '2px solid #4f46e5' : '1px solid var(--border-subtle)',
                background: assignType === 'ADMIN' ? '#eef2ff' : '#ffffff',
                color: assignType === 'ADMIN' ? '#4338ca' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Direct Self Action</span>
                {assignType === 'ADMIN' && <Check size={16} color="#4f46e5" />}
              </div>
              <span style={{ fontSize: '0.74rem', opacity: 0.8 }}>
                Retain ticket in executive administration queue.
              </span>
            </button>
          </div>
        </div>

        {/* Staff Selector Dropdown (when STAFF selected) */}
        {assignType === 'STAFF' && (
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Select Active Personnel ({staffList.length} Available)
            </label>
            <select
              className="search-input"
              style={{ paddingLeft: '14px' }}
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} — {s.department || s.role} ({s.active_tasks || 0} active tasks)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
            className="btn btn-primary"
            onClick={handleAssign}
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};
