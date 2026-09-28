import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  Sliders, 
  CheckCircle2, 
  Maximize2, 
  QrCode, 
  Calendar, 
  User, 
  Tag, 
  X,
  SplitSquareVertical,
  Check,
  Edit3,
  Send,
  FileText,
  Bell
} from 'lucide-react';
import { getImageUrl } from '../api/client';
import client from '../api/client';
import { PushResolutionModal } from '../components/PushResolutionModal';
import { MemoModal } from '../components/MemoModal';

export const GrievanceHub = ({ 
  issues, 
  onOpenAssign, 
  onOpenBan, 
  onOpenReviewModal, 
  onRefresh, 
  showToast,
  stats
}) => {
  const [activeSubTab, setActiveSubTab] = useState('ALL'); // ALL, UNASSIGNED, PENDING_REVIEW, CRITICS, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // ALL, URGENT (8-10), HIGH (6-7), MODERATE (<6)
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [previewImage, setPreviewImage] = useState(null);

  // Modals state
  const [pushResolutionIssue, setPushResolutionIssue] = useState(null);
  const [memoIssue, setMemoIssue] = useState(null);
  const [pushResolutionMessage, setPushResolutionMessage] = useState('');
  const [isPushingResolution, setIsPushingResolution] = useState(false);

  // Admin Resolve Modal State
  const [resolveAdminIssue, setResolveAdminIssue] = useState(null);
  const [adminResolutionNotes, setAdminResolutionNotes] = useState('');
  const [adminResolutionFile, setAdminResolutionFile] = useState(null);
  const [isResolvingAdmin, setIsResolvingAdmin] = useState(false);

  const handleAdminResolve = async (e) => {
    e.preventDefault();
    if (!resolveAdminIssue) return;
    try {
      setIsResolvingAdmin(true);
      const formData = new FormData();
      formData.append('resolution_notes', adminResolutionNotes);
      if (adminResolutionFile) {
        formData.append('resolution_image', adminResolutionFile);
      }

      await client.post(`/api/admin/issues/${resolveAdminIssue._id}/resolve-admin`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResolveAdminIssue(null);
      setAdminResolutionNotes('');
      setAdminResolutionFile(null);
      onRefresh(); // Refresh list locally
    } catch (err) {
      alert(err.response?.data?.message || 'Error resolving issue');
    } finally {
      setIsResolvingAdmin(false);
    }
  };

  // In-line AI Calibration state
  const [calibratingId, setCalibratingId] = useState(null);
  const [calibIssueType, setCalibIssueType] = useState('');
  const [calibScore, setCalibScore] = useState(5);
  const [isCalibratingLoading, setIsCalibratingLoading] = useState(false);

  const CARE_CATEGORIES = [
    'safety and security',
    'drug related issue',
    'harassment and discrimination',
    'ragging and bullying',
    'academic issues',
    'data privacy issues',
    'facilities and welfare issues',
    'other concerns'
  ];

  // Filter Pipeline
  const filteredIssues = issues.filter((issue) => {
    // Sub-tab filter
    if (activeSubTab === 'UNASSIGNED' && issue.status !== 'UNASSIGNED') return false;
    if (activeSubTab === 'PENDING_REVIEW' && issue.status !== 'PENDING_REVIEW') return false;
    if (activeSubTab === 'CRITICS' && !issue.is_confusing_critic) return false;
    if (activeSubTab === 'RESOLVED' && issue.status !== 'POSTED' && issue.status !== 'RESOLVED' && issue.status !== 'ARCHIVED') return false;

    // Severity filter
    if (filterSeverity === 'URGENT' && issue.ai_critical_score < 8) return false;
    if (filterSeverity === 'HIGH' && (issue.ai_critical_score < 6 || issue.ai_critical_score >= 8)) return false;
    if (filterSeverity === 'MODERATE' && issue.ai_critical_score >= 6) return false;

    // Category filter
    if (selectedCategory !== 'ALL') {
      const issueCat = (issue.category || issue.ai_issue_type || '').toLowerCase();
      if (!issueCat.includes(selectedCategory.toLowerCase())) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = (issue.ai_issue_type || '').toLowerCase().includes(q);
      const matchCat = (issue.category || '').toLowerCase().includes(q);
      const matchBlock = (issue.block_name || '').toLowerCase().includes(q);
      const matchZone = (issue.zone || '').toLowerCase().includes(q);
      const matchDesc = (issue.student_description || '').toLowerCase().includes(q);
      const matchStaff = (issue.assigned_to?.name || '').toLowerCase().includes(q);
      const matchId = (issue._id || '').toLowerCase().includes(q);
      const matchClasses = (issue.ai_predicted_classes || []).some(c => c.toLowerCase().includes(q));
      const matchCaption = (issue.ai_caption || '').toLowerCase().includes(q);
      if (!matchType && !matchCat && !matchBlock && !matchZone && !matchDesc && !matchStaff && !matchId && !matchClasses && !matchCaption) {
        return false;
      }
    }

    return true;
  });

  const handleStartCalibrate = (issue) => {
    setCalibratingId(issue._id);
    setCalibIssueType(issue.ai_issue_type || '');
    setCalibScore(issue.ai_critical_score || 5);
  };

  const handleSaveCalibrate = async (issueId) => {
    setIsCalibratingLoading(true);
    try {
      const res = await client.patch(`/api/admin/issues/${issueId}/ai-data`, {
        ai_issue_type: calibIssueType,
        ai_critical_score: calibScore,
        is_confusing_critic: false
      });

      if (res.data.success) {
        showToast('Visual AI calibration saved and verified.', 'success');
        setCalibratingId(null);
        onRefresh();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to calibrate AI data', 'error');
    } finally {
      setIsCalibratingLoading(false);
    }
  };

  const getStatusBadge = (status, isCritic) => {
    if (isCritic) {
      return <span className="badge badge-critic-flag">AI Flagged</span>;
    }
    switch (status) {
      case 'UNASSIGNED':
        return <span className="badge badge-status-unassigned">Action Required</span>;
      case 'ASSIGNED_STAFF':
        return <span className="badge badge-status-assigned">In Progress</span>;
      case 'PENDING_REVIEW':
        return <span className="badge badge-status-review">Pending Verification</span>;
      case 'POSTED':
      case 'RESOLVED':
        return <span className="badge badge-status-posted">Resolved</span>;
      case 'ARCHIVED':
        return <span className="badge badge-secondary">Archived</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#e11d48';
    if (score >= 6) return '#d97706';
    return '#059669';
  };

  const tabCounts = {
    ALL: issues.length,
    UNASSIGNED: issues.filter(i => i.status === 'UNASSIGNED').length,
    PENDING_REVIEW: issues.filter(i => i.status === 'PENDING_REVIEW').length,
    CRITICS: issues.filter(i => i.is_confusing_critic).length,
    RESOLVED: issues.filter(i => i.status === 'POSTED' || i.status === 'RESOLVED').length
  };

  const now = new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Quick Triage Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Campus Grievance Command & Ledger
            </h2>
            <span style={{
              background: '#eef2ff',
              color: '#4338ca',
              border: '1px solid #c7d2fe',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px'
            }}>
              {filteredIssues.length} Incidents
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            SLA enforcement, staff dispatch, direct student resolution messaging, and official memo escalation.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '320px', minWidth: '240px' }}>
          <Search 
            size={16} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            className="search-input"
            placeholder="Search block, category, zone, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Streamlined Filter Pills */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 18px',
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Top Row: Sub-tab Pills & Severity Filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Sub-tab Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Incidents' },
              { id: 'UNASSIGNED', label: 'Unassigned Action' },
              { id: 'PENDING_REVIEW', label: 'Resolution Sign-Off' },
              { id: 'CRITICS', label: 'AI Flagged' },
              { id: 'RESOLVED', label: 'Resolved & Closed' }
            ].map((tab) => {
              const count = tabCounts[tab.id] || 0;
              const isSelected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
                    background: isSelected ? '#4f46e5' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Severity Filter Segment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px' }}>
              Severity:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'URGENT', label: 'Urgent (8-10)' },
              { id: 'HIGH', label: 'High (6-7)' },
              { id: 'MODERATE', label: 'Moderate (<6)' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSeverity(s.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterSeverity === s.id ? '#eef2ff' : '#ffffff',
                  border: filterSeverity === s.id ? '1px solid #c7d2fe' : '1px solid var(--border-subtle)',
                  color: filterSeverity === s.id ? '#4338ca' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Category Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: selectedCategory === 'ALL' ? 700 : 500,
              cursor: 'pointer',
              border: selectedCategory === 'ALL' ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
              background: selectedCategory === 'ALL' ? '#eef2ff' : '#f8fafc',
              color: selectedCategory === 'ALL' ? '#4338ca' : 'var(--text-secondary)'
            }}
          >
            All Categories
          </button>
          {CARE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: selectedCategory === cat ? 700 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                border: selectedCategory === cat ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
                background: selectedCategory === cat ? '#eef2ff' : '#ffffff',
                color: selectedCategory === cat ? '#4338ca' : 'var(--text-secondary)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredIssues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#4f46e5'
          }}>
            <Layers size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Incidents Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '400px', margin: '6px auto 0' }}>
            {searchQuery 
              ? `No records matching "${searchQuery}" in this view.` 
              : 'There are currently no grievances matching your active filter criteria.'}
          </p>
        </div>
      ) : (
        /* Incident Cards Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          gap: '24px'
        }}>
          {filteredIssues.map((issue) => {
            const isUrgent = issue.ai_critical_score >= 8;
            const isCalibrating = calibratingId === issue._id;
            const hasResolution = !!issue.resolution_image_url;
            const isOverdue = issue.status === 'ASSIGNED_STAFF' && issue.sla_deadline && new Date(issue.sla_deadline) < now;

            return (
              <div
                key={issue._id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: isOverdue
                    ? '1.5px solid #fecdd3'
                    : isUrgent && issue.status === 'UNASSIGNED' 
                    ? '1.5px solid #fecdd3' 
                    : issue.status === 'PENDING_REVIEW'
                    ? '1.5px solid #fde68a'
                    : '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {/* Top Meta Bar */}
                <div style={{
                  padding: '14px 18px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: isOverdue ? '#fff1f2' : '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(issue.status, issue.is_confusing_critic)}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      #{issue._id.slice(-6).toUpperCase()}
                    </span>
                    {issue.submission_type === 'TEXT' && (
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem' }}>
                        TEXT SUBMISSION
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* SLA Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isOverdue ? '#be123c' : '#4338ca',
                      background: isOverdue ? '#fee2e2' : '#eef2ff',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      <Clock size={11} />
                      <span>
                        {isOverdue ? 'SLA BREACHED' : `SLA: ${issue.sla_deadline ? new Date(issue.sla_deadline).toLocaleDateString() : '48h'}`}
                      </span>
                    </div>

                    {/* Notification Pushed Status */}
                    {issue.resolution_notified_to_student && (
                      <span className="badge badge-status-posted" style={{ fontSize: '0.68rem' }}>
                        <Send size={10} /> Notified Student
                      </span>
                    )}
                  </div>
                </div>

                {/* Images Section (if available) */}
                {issue.original_image_url && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: hasResolution ? '1fr 1fr' : '1fr',
                    gap: '8px',
                    padding: '12px 18px',
                    background: '#f8fafc',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ position: 'relative', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={getImageUrl(issue.original_image_url)}
                        alt="Incident"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        BEFORE CAPTURE
                      </span>
                      <button
                        onClick={() => setPreviewImage(getImageUrl(issue.original_image_url))}
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px',
                          cursor: 'pointer',
                          color: '#0f172a'
                        }}
                      >
                        <Maximize2 size={13} />
                      </button>
                    </div>

                    {hasResolution && (
                      <div style={{ position: 'relative', height: '160px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #a7f3d0' }}>
                        <img
                          src={getImageUrl(issue.resolution_image_url)}
                          alt="Resolution"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          AFTER FIX
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                  {/* Category & Severity Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.3', textTransform: 'capitalize' }}>
                        {issue.category || issue.ai_issue_type}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                        <MapPin size={13} color="#0284c7" />
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{issue.zone}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: getScoreColor(issue.ai_critical_score) }}>
                        {issue.ai_critical_score}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/10</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: getScoreColor(issue.ai_critical_score) }}>
                        {isUrgent ? 'URGENT' : issue.ai_critical_score >= 6 ? 'HIGH' : 'MODERATE'}
                      </div>
                    </div>
                  </div>

                  {/* Student Description Note */}
                  {issue.student_description && (
                    <div style={{
                      fontSize: '0.83rem',
                      color: 'var(--text-secondary)',
                      background: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Student Note
                      </span>
                      "{issue.student_description}"
                    </div>
                  )}

                  {/* Staff Resolution Notes */}
                  {issue.resolution_notes && (
                    <div style={{
                      fontSize: '0.83rem',
                      color: '#065f46',
                      background: '#ecfdf5',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ fontWeight: 700, color: '#047857', display: 'block', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Staff Resolution Proof Notes
                      </span>
                      "{issue.resolution_notes}"
                    </div>
                  )}

                  {/* Pushed Message Preview */}
                  {issue.resolution_push_message && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#4338ca',
                      background: '#eef2ff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #c7d2fe'
                    }}>
                      <span style={{ fontWeight: 700, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Pushed to Student Alert
                      </span>
                      "{issue.resolution_push_message}"
                    </div>
                  )}

                  {/* Inline Calibration Drawer */}
                  {isCalibrating && (
                    <div style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #c7d2fe',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4338ca' }}>
                        Calibrate Visual Classification
                      </div>
                      
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Primary Issue Classification:
                        </label>
                        <input
                          type="text"
                          className="search-input"
                          style={{ padding: '8px 12px' }}
                          value={calibIssueType}
                          onChange={(e) => setCalibIssueType(e.target.value)}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span>Severity Calibration:</span>
                          <span style={{ fontWeight: 700, color: getScoreColor(calibScore) }}>{calibScore}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={calibScore}
                          onChange={(e) => setCalibScore(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#4f46e5', marginTop: '4px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCalibratingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveCalibrate(issue._id)}
                          disabled={isCalibratingLoading}
                        >
                          <Check size={13} /> {isCalibratingLoading ? 'Saving...' : 'Apply Calibration'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Assigned Officer / Time Footer */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <div>
                      {issue.assigned_to ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4338ca', fontWeight: 600 }}>
                          <UserCheck size={13} /> {issue.assigned_to.name}
                        </span>
                      ) : (
                        <span style={{ color: '#e11d48', fontWeight: 600 }}>
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{new Date(issue.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    paddingTop: '6px'
                  }}>
                    {/* Left Actions: Calibrate & Ban */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleStartCalibrate(issue)}
                        className="btn-icon"
                        title="Calibrate Visual Classification"
                      >
                        <Sliders size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenBan(issue.reporter_hash)}
                        className="btn-icon"
                        style={{ color: '#e11d48' }}
                        title="Blacklist Spam Hash"
                      >
                        <ShieldAlert size={14} />
                      </button>

                      {/* Raise Memo if Overdue */}
                      {isOverdue && issue.assigned_to && (
                        <button
                          type="button"
                          onClick={() => setMemoIssue(issue)}
                          className="btn"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            background: '#fee2e2',
                            color: '#be123c',
                            border: '1px solid #fecdd3',
                            borderRadius: '6px'
                          }}
                          title="Raise Official Overdue Memo"
                        >
                          <FileText size={12} /> Memo
                        </button>
                      )}
                    </div>

                    {/* Right Actions: Assign / Review / Push to Student */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {issue.status === 'UNASSIGNED' && (
                        <button
                          type="button"
                          onClick={() => onOpenAssign(issue)}
                          className="btn btn-primary btn-sm"
                        >
                          <UserCheck size={14} /> Assign Officer
                        </button>
                      )}

                      {issue.status === 'ASSIGNED_STAFF' && (
                        <button
                          type="button"
                          onClick={() => onOpenAssign(issue)}
                          className="btn btn-secondary btn-sm"
                        >
                          Reassign
                        </button>
                      )}

                      {issue.status === 'ASSIGNED_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setResolveAdminIssue(issue)}
                          className="btn btn-emerald btn-sm"
                        >
                          <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Complete & Close (Admin)
                        </button>
                      )}

                      {issue.status === 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => onOpenReviewModal && onOpenReviewModal(issue)}
                          className="btn btn-emerald btn-sm"
                        >
                          <CheckCircle2 size={14} /> Review Proof
                        </button>
                      )}

                      {/* Direct Student Push Resolution Button */}
                      {(issue.status === 'POSTED' || issue.status === 'RESOLVED' || issue.status === 'PENDING_REVIEW') && (
                        <button
                          type="button"
                          onClick={() => setPushResolutionIssue(issue)}
                          className="btn btn-sm"
                          style={{
                            background: issue.resolution_notified_to_student ? '#eef2ff' : '#ecfdf5',
                            border: `1px solid ${issue.resolution_notified_to_student ? '#c7d2fe' : '#a7f3d0'}`,
                            color: issue.resolution_notified_to_student ? '#4338ca' : '#047857'
                          }}
                        >
                          <Send size={13} /> {issue.resolution_notified_to_student ? 'Update Student Msg' : 'Push to Student'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Light Photo Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-medium)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#0f172a',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              ✕
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                borderRadius: '10px', 
                display: 'block' 
              }} 
            />
          </div>
        </div>
      )}

      {/* Push Resolution to Student Modal */}
      {pushResolutionIssue && (
        <PushResolutionModal
          issue={pushResolutionIssue}
          onClose={() => setPushResolutionIssue(null)}
          onPushed={() => {
            showToast('Resolution alert successfully dispatched to student.', 'success');
            onRefresh();
          }}
        />
      )}

      {/* Staff Memo Modal */}
      {memoIssue && memoIssue.assigned_to && (
        <MemoModal
          staff={memoIssue.assigned_to}
          issue={memoIssue}
          onClose={() => setMemoIssue(null)}
          onMemoIssued={() => {
            showToast('Official staff memo issued and PDF downloaded.', 'info');
            onRefresh();
          }}
        />
      )}

      {/* Admin Resolve Modal */}
      {resolveAdminIssue && (
        <div className="modal-overlay" onClick={() => setResolveAdminIssue(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669'
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Resolve Issue</h3>
              </div>
              <button 
                onClick={() => setResolveAdminIssue(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <form onSubmit={handleAdminResolve} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  You are completing this issue directly. It will be marked as POSTED (closed).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Resolution Notes / Action Taken</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Describe what was done to fix this..."
                    value={adminResolutionNotes}
                    onChange={e => setAdminResolutionNotes(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Optional Proof Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setAdminResolutionFile(e.target.files[0])}
                    className="input-field"
                    style={{ padding: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button type="button" className="btn" style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }} onClick={() => setResolveAdminIssue(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-emerald" disabled={isResolvingAdmin}>
                    {isResolvingAdmin ? 'Completing...' : 'Complete Issue'}
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
