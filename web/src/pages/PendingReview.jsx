import React from 'react';
import { CheckSquare, CheckCircle, Archive, SplitSquareVertical, User, Calendar, MapPin } from 'lucide-react';
import { getImageUrl } from '../api/client';

export const PendingReview = ({ issues, onOpenReviewModal, onQuickReview }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Resolution Sign-Off Queue
            </h2>
            <span className="badge badge-status-review">
              {issues.length} Awaiting Verification
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Staff have uploaded live photographic proof of fix. Inspect Before vs After before public release.
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <CheckCircle size={28} />
          </div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>All Resolutions Verified!</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            There are currently no staff resolutions waiting for administrative review.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '24px' }}>
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: '18px',
                border: '1.5px solid #fde68a',
                background: '#ffffff',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {/* Dual Image Preview (Before vs After) */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  padding: '14px',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
                onClick={() => onOpenReviewModal(issue)}
                title="Click to open interactive Before/After comparison slider"
              >
                {/* Before Photo */}
                <div style={{
                  position: 'relative',
                  height: '160px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1.5px solid #fecdd3'
                }}>
                  <img
                    src={getImageUrl(issue.original_image_url)}
                    alt="Before"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#e11d48', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                    BEFORE
                  </div>
                </div>

                {/* After Photo */}
                <div style={{
                  position: 'relative',
                  height: '160px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1.5px solid #a7f3d0'
                }}>
                  <img
                    src={getImageUrl(issue.resolution_image_url)}
                    alt="After"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#059669', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                    AFTER PROOF
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#ffffff',
                    fontWeight: 600
                  }}>
                    <SplitSquareVertical size={12} /> Compare
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {issue.ai_issue_type}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '3px' }}>
                      <MapPin size={13} color="#0284c7" />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{issue.zone}</span>
                    </div>
                  </div>
                  <span className="badge badge-status-review">AWAITING REVIEW</span>
                </div>

                {/* Staff Resolver Info */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4338ca', fontWeight: 700 }}>
                    <User size={14} /> {issue.assigned_to?.name || 'Assigned Officer'}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {issue.resolved_at ? new Date(issue.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </div>
                </div>

                {/* Notes comparison */}
                {issue.resolution_notes && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.8rem',
                    color: '#065f46',
                    lineHeight: '1.4'
                  }}>
                    <span style={{ fontWeight: 800, color: '#047857', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Resolution Notes
                    </span>
                    "{issue.resolution_notes}"
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => onOpenReviewModal(issue)}
                    className="btn btn-secondary btn-sm"
                  >
                    <SplitSquareVertical size={14} /> Full Slider
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onQuickReview(issue._id, 'ARCHIVE')}
                      className="btn btn-danger btn-sm"
                    >
                      <Archive size={14} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickReview(issue._id, 'POST')}
                      className="btn btn-emerald btn-sm"
                    >
                      <CheckCircle size={14} /> Approve & Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
