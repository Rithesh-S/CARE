import React, { useState, useRef } from 'react';
import { X, CheckCircle, Archive, SplitSquareVertical, Columns, ArrowLeftRight, User, Calendar, MapPin } from 'lucide-react';
import { getImageUrl } from '../api/client';
import confetti from 'canvas-confetti';

export const ImageComparisonModal = ({ issue, onClose, onReview }) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'side-by-side'
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  if (!issue) return null;

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  };

  const handleApprove = () => {
    // Trigger confetti celebration!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onReview(issue._id, 'POST');
    onClose();
  };

  const handleArchive = () => {
    onReview(issue._id, 'ARCHIVE');
    onClose();
  };

  const originalImg = getImageUrl(issue.original_image_url);
  const resolutionImg = getImageUrl(issue.resolution_image_url);

  return (
    <div className="modal-overlay" onClick={onClose} onMouseUp={() => setIsDragging(false)}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '850px', padding: '26px', background: '#ffffff' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-status-review">PENDING RESOLUTION REVIEW</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                #{issue._id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {issue.ai_issue_type}
            </h3>
          </div>

          {/* View mode switch & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                style={{
                  background: viewMode === 'slider' ? '#4f46e5' : 'transparent',
                  color: viewMode === 'slider' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                title="Split Comparison Slider"
              >
                <SplitSquareVertical size={14} /> Slider
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                style={{
                  background: viewMode === 'side-by-side' ? '#4f46e5' : 'transparent',
                  color: viewMode === 'side-by-side' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                title="Side by Side View"
              >
                <Columns size={14} /> Side-by-Side
              </button>
            </div>

            <button 
              onClick={onClose} 
              style={{ 
                background: '#f8fafc', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '8px',
                padding: '6px',
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Visualizer Frame */}
        <div style={{ marginBottom: '20px' }}>
          {viewMode === 'slider' ? (
            <div
              ref={containerRef}
              className="comparison-container"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onMouseDown={() => setIsDragging(true)}
              style={{ height: '380px', cursor: 'ew-resize', borderRadius: '14px', border: '1.5px solid var(--border-medium)' }}
            >
              {/* "After" Resolution Image (Background Full) */}
              <img
                src={resolutionImg}
                alt="After Resolution"
                className="comparison-img"
                style={{ height: '380px', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#059669',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.04em'
              }}>
                AFTER (RESOLVED)
              </div>

              {/* "Before" Original Issue Image (Clipped) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${sliderPos}%`,
                  overflow: 'hidden',
                  borderRight: '3px solid #ffffff'
                }}
              >
                <img
                  src={originalImg}
                  alt="Original Incident"
                  style={{
                    width: containerRef.current ? `${containerRef.current.clientWidth}px` : '800px',
                    height: '380px',
                    objectFit: 'cover',
                    maxWidth: 'none'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#e11d48',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.04em'
                }}>
                  BEFORE (REPORTED)
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  transform: 'translateX(-50%)',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              >
                <div className="comparison-slider-button">
                  <ArrowLeftRight size={18} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #fecdd3' }}>
                <img src={originalImg} alt="Before" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#e11d48', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                  BEFORE (REPORTED)
                </div>
              </div>
              <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #a7f3d0' }}>
                <img src={resolutionImg} alt="After" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#059669', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                  AFTER (RESOLVED)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#0284c7" /> Campus Zone
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {issue.zone}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} color="#4f46e5" /> Resolved By
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#4338ca', marginTop: '2px' }}>
              {issue.assigned_to?.name || 'Assigned Staff'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="#059669" /> Resolved Timestamp
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {issue.resolved_at ? new Date(issue.resolved_at).toLocaleString() : 'Just now'}
            </div>
          </div>
        </div>

        {/* Notes comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecdd3' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#be123c', display: 'block', marginBottom: '4px', letterSpacing: '0.04em' }}>
              STUDENT REPORT NOTE
            </span>
            <p style={{ fontSize: '0.85rem', color: '#881337', lineHeight: '1.4' }}>
              {issue.student_description ? `"${issue.student_description}"` : 'No additional note provided.'}
            </p>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '4px', letterSpacing: '0.04em' }}>
              STAFF RESOLUTION SUMMARY
            </span>
            <p style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: '1.4' }}>
              {issue.resolution_notes ? `"${issue.resolution_notes}"` : 'Grievance addressed on-site as photographed.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close Viewer
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={handleArchive} 
              className="btn btn-danger"
            >
              <Archive size={16} /> Archive / Reject
            </button>
            <button 
              type="button" 
              onClick={handleApprove} 
              className="btn btn-emerald"
            >
              <CheckCircle size={16} /> Approve & Publish to Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
