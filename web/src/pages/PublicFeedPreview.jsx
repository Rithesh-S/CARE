import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, MapPin, Calendar, Clock, Bell, User } from 'lucide-react';
import { getImageUrl } from '../api/client';
import client from '../api/client';
import { PushResolutionModal } from '../components/PushResolutionModal';

export const PublicFeedPreview = () => {
  const [resolvedIssues, setResolvedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueForPush, setSelectedIssueForPush] = useState(null);

  useEffect(() => {
    fetchResolvedIssues();
  }, []);

  const fetchResolvedIssues = async () => {
    try {
      const res = await client.get('/api/admin/issues/all?status=POSTED');
      if (res.data.success) {
        setResolvedIssues(res.data.issues || []);
      }
    } catch (err) {
      console.error('Failed to load resolved issues:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Resolution Direct Alerts & Student Dispatch Ledger
          </h2>
          <span className="badge badge-status-posted">
            {resolvedIssues.length} Resolved Cases
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Campus-wide community feed has been replaced by direct student resolution notifications. Push customized resolution messages directly to reporting students.
        </p>
      </div>

      {resolvedIssues.length === 0 ? (
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
            <Bell size={28} />
          </div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Resolved Cases Awaiting Dispatch</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Approve resolved grievances from the "Resolution Sign-Off" queue to notify students.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
          {resolvedIssues.map((item) => (
            <div
              key={item._id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: '18px',
                border: '1.5px solid #a7f3d0',
                background: '#ffffff',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {/* Dual image banner */}
              {item.original_image_url && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: item.resolution_image_url ? '1fr 1fr' : '1fr',
                  gap: '10px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ position: 'relative', height: '150px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #fecdd3' }}>
                    <img src={getImageUrl(item.original_image_url)} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#e11d48', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                      BEFORE
                    </div>
                  </div>

                  {item.resolution_image_url && (
                    <div style={{ position: 'relative', height: '150px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #a7f3d0' }}>
                      <img src={getImageUrl(item.resolution_image_url)} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#059669', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800 }}>
                        RESOLVED
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {item.category || item.ai_issue_type}
                  </h3>
                  <span className="badge badge-status-posted">
                    <CheckCircle2 size={12} /> VERIFIED FIX
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={14} color="#0284c7" />
                  <span style={{ fontWeight: 600 }}>{item.zone}</span>
                </div>

                {item.resolution_notes && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    fontSize: '0.8rem',
                    color: '#166534',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#15803d' }}>Staff Action:</strong> {item.resolution_notes}
                  </div>
                )}

                {/* Pushed Message Status Box */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: item.resolution_notified_to_student ? '#eef2ff' : '#fffbeb',
                  border: `1px solid ${item.resolution_notified_to_student ? '#c7d2fe' : '#fed7aa'}`,
                  fontSize: '0.825rem',
                  lineHeight: '1.45'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: item.resolution_notified_to_student ? '#4338ca' : '#b45309' }}>
                      {item.resolution_notified_to_student ? '✓ Dispatched to Student' : '⏳ Pending Student Message'}
                    </span>
                    {item.resolution_pushed_at && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(item.resolution_pushed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    "{item.resolution_push_message || 'Standard verification notification queued.'}"
                  </div>
                </div>

                {/* Footer and Update Action */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>Fixed: {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  <button
                    onClick={() => setSelectedIssueForPush(item)}
                    className="btn btn-sm"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      background: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '6px'
                    }}
                  >
                    <Send size={12} /> {item.resolution_notified_to_student ? 'Update Message' : 'Push Message'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Push Modal */}
      {selectedIssueForPush && (
        <PushResolutionModal
          issue={selectedIssueForPush}
          onClose={() => setSelectedIssueForPush(null)}
          onPushed={() => {
            fetchResolvedIssues();
          }}
        />
      )}
    </div>
  );
};
