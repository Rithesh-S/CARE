import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  CheckSquare,
  Layers,
  SplitSquareVertical,
  FileText,
  ShieldAlert,
  AlertCircle,
  X
} from 'lucide-react';
import client, { getImageUrl } from '../api/client';
import { MemoModal } from '../components/MemoModal';
import { ExtensionReviewModal } from '../components/ExtensionReviewModal';

export const StaffManagement = ({ 
  staffList = [], 
  onOpenAssign, 
  onOpenReviewModal, 
  onQuickReview,
  onRefresh
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [taskFilter, setTaskFilter] = useState('ALL'); // 'ALL', 'IN_PROGRESS', 'PENDING_REVIEW', 'RESOLVED', 'OVERDUE'

  // Modal States
  const [memoTarget, setMemoTarget] = useState(null); // { staff, issue }
  const [extensionTargetIssue, setExtensionTargetIssue] = useState(null);
  
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    try {
      setIsAdding(true);
      await client.post('/api/admin/staff', { name: newStaffName, email: newStaffEmail });
      setShowAddStaff(false);
      setNewStaffName('');
      setNewStaffEmail('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding staff');
    } finally {
      setIsAdding(false);
    }
  };

  // Summary Metrics
  const totalOfficers = staffList.length;
  const totalActiveTasks = staffList.reduce((acc, s) => acc + (s.active_tasks || 0), 0);
  const totalPendingReview = staffList.reduce((acc, s) => acc + (s.pending_review_tasks || 0), 0);
  const totalResolved = staffList.reduce((acc, s) => acc + (s.resolved_tasks || 0), 0);
  const totalOverdue = staffList.reduce((acc, s) => acc + (s.overdue_tasks || 0), 0);
  const totalPendingExtensions = staffList.reduce((acc, s) => acc + (s.pending_extensions || 0), 0);
  const totalMemosIssued = staffList.reduce((acc, s) => acc + (s.memos_issued || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSIGNED_STAFF':
        return <span className="badge badge-status-assigned"><Clock size={11} /> IN PROGRESS</span>;
      case 'PENDING_REVIEW':
        return <span className="badge badge-status-review"><CheckSquare size={11} /> PENDING SIGN-OFF</span>;
      case 'POSTED':
      case 'ARCHIVED':
        return <span className="badge badge-status-posted"><CheckCircle2 size={11} /> VERIFIED RESOLUTION</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#e11d48';
    if (score >= 6) return '#d97706';
    return '#059669';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Staff Operations, SLA Deadlines & Accountability
          </h2>
          <span className="badge badge-status-assigned">
            {totalOfficers} Field Officers Active
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowAddStaff(true)} className="btn btn-primary btn-sm">
            <UserCheck size={14} style={{ marginRight: '4px' }} /> Add Staff Member
          </button>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Monitor assigned grievances, track SLA compliance deadlines, review staff extension requests, and issue formal administrative memoranda for delayed tasks.
        </p>
      </div>

      {/* KPI Overview Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Personnel
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {totalOfficers}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Department specialists
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            In Progress Tasks
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4338ca', marginTop: '6px' }}>
            {totalActiveTasks}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Under active field SLA
          </div>
        </div>

        <div className="kpi-card" style={{ borderColor: totalOverdue > 0 ? '#fecdd3' : 'var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Overdue Tasks
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: totalOverdue > 0 ? '#be123c' : 'var(--text-primary)', marginTop: '6px' }}>
            {totalOverdue}
          </div>
          <div style={{ fontSize: '0.74rem', color: totalOverdue > 0 ? '#e11d48' : 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
            {totalOverdue > 0 ? 'Memo eligible breaches' : 'Zero Breaches'}
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Extension Requests
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {totalPendingExtensions}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Awaiting admin signoff
          </div>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Memos Issued
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#9f1239', marginTop: '6px' }}>
            {totalMemosIssued}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Formal PDF notices
          </div>
        </div>
      </div>

      {/* Staff Members List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {staffList.map((staff) => {
          const isExpanded = selectedStaffId === staff._id;
          const tasks = staff.tasks || [];
          const overdueTasks = tasks.filter(t => t.status === 'ASSIGNED_STAFF' && t.sla_deadline && new Date(t.sla_deadline) < new Date());
          const pendingExtensions = tasks.filter(t => t.extension_status === 'PENDING');

          return (
            <div
              key={staff._id}
              className="glass-panel"
              style={{
                borderRadius: '16px',
                background: '#ffffff',
                border: overdueTasks.length > 0 ? '1.5px solid #fecdd3' : '1px solid var(--border-subtle)',
                overflow: 'hidden'
              }}
            >
              {/* Staff Summary Card Header */}
              <div
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: overdueTasks.length > 0 ? '#fff1f2' : '#ffffff',
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
                onClick={() => setSelectedStaffId(isExpanded ? null : staff._id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: overdueTasks.length > 0 ? '#fee2e2' : '#eef2ff',
                    color: overdueTasks.length > 0 ? '#e11d48' : '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}>
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {staff.name}
                      </h3>
                      {overdueTasks.length > 0 && (
                        <span className="badge badge-status-unassigned" style={{ fontSize: '0.68rem' }}>
                          <AlertTriangle size={11} /> {overdueTasks.length} Overdue
                        </span>
                      )}
                      {pendingExtensions.length > 0 && (
                        <span className="badge badge-status-review" style={{ fontSize: '0.68rem' }}>
                          <Clock size={11} /> {pendingExtensions.length} Extension Req.
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                      <Mail size={13} />
                      <span>{staff.email}</span>
                    </div>
                  </div>
                </div>

                {/* Badges & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-status-assigned">
                      {staff.active_tasks || 0} Active
                    </span>
                    <span className="badge badge-status-review">
                      {staff.pending_review_tasks || 0} In Review
                    </span>
                    <span className="badge badge-status-posted">
                      {staff.resolved_tasks || 0} Resolved
                    </span>
                  </div>

                  {/* Raise Memo Button if Overdue */}
                  {overdueTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemoTarget({ staff, issue: overdueTasks[0] });
                      }}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        background: '#be123c',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      title="Issue official memorandum and download PDF"
                    >
                      <FileText size={14} /> Raise Formal Memo
                    </button>
                  )}

                  <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Tasks Ledger */}
              {isExpanded && (
                <div style={{ padding: '20px 24px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Assigned Grievances Ledger ({tasks.length} Total Tasks)
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['ALL', 'IN_PROGRESS', 'PENDING_REVIEW', 'RESOLVED'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setTaskFilter(f)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            border: taskFilter === f ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
                            background: taskFilter === f ? '#eef2ff' : '#ffffff',
                            color: taskFilter === f ? '#4338ca' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No tasks assigned to this staff member yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tasks
                        .filter(t => {
                          if (taskFilter === 'IN_PROGRESS') return t.status === 'ASSIGNED_STAFF';
                          if (taskFilter === 'PENDING_REVIEW') return t.status === 'PENDING_REVIEW';
                          if (taskFilter === 'RESOLVED') return t.status === 'POSTED' || t.status === 'ARCHIVED';
                          return true;
                        })
                        .map((task) => {
                          const isOverdue = task.status === 'ASSIGNED_STAFF' && task.sla_deadline && new Date(task.sla_deadline) < new Date();
                          const hasPendingExtension = task.extension_status === 'PENDING';

                          return (
                            <div
                              key={task._id}
                              style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: '#ffffff',
                                border: isOverdue ? '1.5px solid #fecdd3' : '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {task.original_image_url && (
                                  <img
                                    src={getImageUrl(task.original_image_url)}
                                    alt="Incident"
                                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
                                )}
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                      {task.category || task.ai_issue_type}
                                    </span>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: `${getScoreColor(task.ai_critical_score)}18`,
                                      color: getScoreColor(task.ai_critical_score)
                                    }}>
                                      Score: {task.ai_critical_score}/10
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '3px' }}>
                                    <MapPin size={12} color="#0284c7" />
                                    <span>{task.zone}</span>
                                  </div>
                                </div>
                              </div>

                              {/* SLA & Status Info */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.74rem', color: isOverdue ? '#be123c' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 500 }}>
                                    {isOverdue ? '🚨 SLA BREACHED' : 'SLA Due:'} {task.sla_deadline ? new Date(task.sla_deadline).toLocaleDateString() : '48h'}
                                  </div>
                                  {getStatusBadge(task.status)}
                                </div>

                                {/* Action Buttons */}
                                {hasPendingExtension && (
                                  <button
                                    onClick={() => setExtensionTargetIssue(task)}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.72rem',
                                      background: '#fffbeb',
                                      borderColor: '#fed7aa',
                                      color: '#b45309'
                                    }}
                                  >
                                    Review +{task.extension_days}d Extension
                                  </button>
                                )}

                                {isOverdue && (
                                  <button
                                    onClick={() => setMemoTarget({ staff, issue: task })}
                                    className="btn"
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '0.72rem',
                                      background: '#be123c',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    <FileText size={12} /> Issue Memo
                                  </button>
                                )}

                                {task.status === 'PENDING_REVIEW' && (
                                  <button
                                    onClick={() => onOpenReviewModal(task)}
                                    className="btn btn-emerald"
                                    style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                                  >
                                    Verify Proof
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {memoTarget && (
        <MemoModal
          staff={memoTarget.staff}
          issue={memoTarget.issue}
          onClose={() => setMemoTarget(null)}
          onMemoIssued={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {extensionTargetIssue && (
        <ExtensionReviewModal
          issue={extensionTargetIssue}
          onClose={() => setExtensionTargetIssue(null)}
          onReviewed={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="modal-overlay" onClick={() => setShowAddStaff(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: '#eef2ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5'
                }}>
                  <UserCheck size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Staff Member</h3>
              </div>
              <button 
                onClick={() => setShowAddStaff(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. John Doe"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Institutional Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. staff@skcet.ac.in"
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button type="button" className="btn" style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} onClick={() => setShowAddStaff(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isAdding}>
                    {isAdding ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
