import React, { useState } from 'react';
import { 
  AlertTriangle, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  QrCode, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Filter, 
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { getImageUrl } from '../api/client';

export const UnassignedQueue = ({ 
  issues, 
  onOpenAssign, 
  onAssignSelf, 
  onOpenBan, 
  onRefresh 
}) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL', 'URGENT', 'HIGH', 'MODERATE'
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity === 'URGENT' && issue.ai_critical_score < 8) return false;
    if (filterSeverity === 'HIGH' && (issue.ai_critical_score < 6 || issue.ai_critical_score >= 8)) return false;
    if (filterSeverity === 'MODERATE' && issue.ai_critical_score >= 6) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.zone.toLowerCase().includes(q) ||
        issue.ai_issue_type.toLowerCase().includes(q) ||
        (issue.student_description && issue.student_description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Unassigned Triage Queue
            </h2>
            <span className="badge badge-critical-urgent">
              {issues.length} Pending Triage
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Prioritized descending by AI Critical Severity Score (10 to 1)
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '8px'
          }}>
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search zone, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          {/* Severity Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '2px', borderRadius: '8px' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'URGENT', label: 'Urgent (8-10)' },
              { id: 'HIGH', label: 'High (6-7)' },
              { id: 'MODERATE', label: 'Moderate (<6)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverity(tab.id)}
                style={{
                  background: filterSeverity === tab.id ? 'var(--accent-primary)' : 'transparent',
                  color: filterSeverity === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issues Grid / List */}
      {filteredIssues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertTriangle size={36} className="text-slate-500" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>No matching unassigned grievances</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Try resetting your search query or filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredIssues.map((issue) => {
            const isUrgent = issue.ai_critical_score >= 8;
            const isHigh = issue.ai_critical_score >= 6 && issue.ai_critical_score < 8;

            return (
              <div
                key={issue._id}
                className={`glass-panel ${isUrgent ? 'glass-panel-glow' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: isUrgent ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                  position: 'relative'
                }}
              >
                {/* Image & Overlay Badges */}
                <div style={{ position: 'relative', height: '190px', background: '#020617', overflow: 'hidden' }}>
                  <img
                    src={getImageUrl(issue.original_image_url)}
                    alt={issue.ai_issue_type}
                    onClick={() => setPreviewImage(getImageUrl(issue.original_image_url))}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'zoom-in',
                      transition: 'transform 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                  />

                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    <span className={`badge ${isUrgent ? 'badge-critical-urgent animate-pulse-glow' : isHigh ? 'badge-critical-high' : 'badge-critical-med'}`}>
                      Severity {issue.ai_critical_score}/10
                    </span>
                    {issue.location_method === 'QR' && (
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: '#38bdf8' }}>
                        <QrCode size={12} /> QR VERIFIED
                      </span>
                    )}
                  </div>

                  {issue.is_confusing_critic && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className="badge badge-critic-flag">
                        <Sparkles size={12} /> CONFUSING CRITIC
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category Title */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                    {issue.ai_issue_type}
                  </h3>

                  {/* Zone Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                    <MapPin size={14} className="text-cyan-400 shrink-0" />
                    <span>{issue.zone}</span>
                  </div>

                  {/* Severity Bar Indicator */}
                  <div style={{ marginBottom: '14px' }}>
                    <div className="score-meter">
                      <div
                        className="score-meter-fill"
                        style={{
                          width: `${issue.ai_critical_score * 10}%`,
                          background: isUrgent 
                            ? 'linear-gradient(90deg, #f59e0b 0%, #f43f5e 100%)' 
                            : isHigh 
                            ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)' 
                            : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Student Description */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                    marginBottom: '14px',
                    flex: 1
                  }}>
                    {issue.student_description ? `"${issue.student_description}"` : <em>No optional description provided.</em>}
                  </div>

                  {/* Reporter Hash & Timestamp */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{new Date(issue.createdAt).toLocaleDateString()} at {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span title={issue.reporter_hash} style={{ fontFamily: 'var(--font-mono)' }}>
                      Hash: {issue.reporter_hash.substring(0, 6)}...
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => onOpenAssign(issue)}
                      className="btn btn-primary btn-sm"
                    >
                      <UserCheck size={15} /> Assign Staff
                    </button>

                    <button
                      type="button"
                      onClick={() => onAssignSelf(issue._id)}
                      className="btn btn-secondary btn-sm"
                      title="Assign directly to Admin (Self)"
                    >
                      <Shield size={15} /> Self
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenBan(issue)}
                      className="btn btn-outline-danger btn-sm"
                      title="Flag & Blacklist Reporter Hash (Spam Control)"
                    >
                      <ShieldAlert size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewImage} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px' }} />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
