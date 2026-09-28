import React, { useState } from 'react';
import { Sparkles, Edit3, Check, UserCheck, ShieldAlert, AlertCircle, MapPin, Sliders } from 'lucide-react';
import { getImageUrl } from '../api/client';
import client from '../api/client';

const COMMON_CATEGORIES = [
  'Water Leakage / Pipe Burst',
  'Electrical Hazard / Exposed Wiring',
  'Broken Furniture / Classroom Desk',
  'Sanitation / Waste Overflow',
  'AC / Ventilation Failure',
  'Structural Crack / Tile Damage',
  'Lab Equipment / Projector Fault',
  'Fire Safety / Extinguisher Defect',
  'Campus Wi-Fi / LAN Point'
];

export const ConfusingCritics = ({ issues, onOpenAssign, onOpenBan, onRefresh, showToast }) => {
  const [editingId, setEditingId] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editScore, setEditScore] = useState(5);
  const [loading, setLoading] = useState(false);

  const startEdit = (issue) => {
    setEditingId(issue._id);
    setEditCategory(issue.ai_issue_type);
    setEditScore(issue.ai_critical_score);
  };

  const handleSaveAiOverride = async (issueId) => {
    setLoading(true);
    try {
      const res = await client.patch(`/api/admin/issues/${issueId}/ai-data`, {
        ai_issue_type: editCategory,
        ai_critical_score: editScore,
        is_confusing_critic: false // Cleared once manually overridden!
      });

      if (res.data.success) {
        showToast('AI classification manually calibrated and verified.', 'success');
        setEditingId(null);
        onRefresh();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update AI classification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Confusing Critics Intelligence Hub
            </h2>
            <span className="badge badge-critic-flag">
              {issues.length} Edge Cases Flagged
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            AI Vision edge cases requiring human operator calibration, manual categorization, or score override.
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Sparkles size={36} className="text-purple-400" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>No Confusing Critics Found</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            The AI model has high certainty on all current grievance submissions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
          {issues.map((issue) => {
            const isEditing = editingId === issue._id;

            return (
              <div
                key={issue._id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', height: '180px', background: '#020617' }}>
                  <img
                    src={getImageUrl(issue.original_image_url)}
                    alt={issue.ai_issue_type}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="badge badge-critic-flag">
                      <Sparkles size={12} /> AMBIGUOUS VLM OUTPUT
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#e2e8f0' }}>
                    Status: <strong style={{ color: '#a5b4fc' }}>{issue.status}</strong>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {isEditing ? (
                    /* Edit Form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          MANUAL ISSUE CATEGORY
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            marginTop: '4px',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid var(--border-glow)',
                            color: '#ffffff',
                            fontSize: '0.85rem'
                          }}
                        >
                          {COMMON_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <span>SEVERITY CRITICAL SCORE</span>
                          <span style={{ color: editScore >= 8 ? '#fb7185' : '#fbbf24' }}>{editScore} / 10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={editScore}
                          onChange={(e) => setEditScore(Number(e.target.value))}
                          style={{ width: '100%', marginTop: '6px', accentColor: '#a855f7' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveAiOverride(issue._id)}
                          disabled={loading}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, background: '#a855f7' }}
                        >
                          <Check size={14} /> Save & Clear Flag
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display View */
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                          {issue.ai_issue_type}
                        </h3>
                        <span className={`badge ${issue.ai_critical_score >= 8 ? 'badge-critical-urgent' : issue.ai_critical_score >= 5 ? 'badge-critical-high' : 'badge-critical-med'}`}>
                          Score {issue.ai_critical_score}/10
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                        <MapPin size={14} className="text-cyan-400" />
                        <span>{issue.zone}</span>
                      </div>

                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.06)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        fontSize: '0.825rem',
                        color: '#e9d5ff',
                        lineHeight: '1.4',
                        marginBottom: '14px',
                        flex: 1
                      }}>
                        <strong>Student Description:</strong> {issue.student_description || <em>None</em>}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => startEdit(issue)}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Sliders size={14} /> Calibrate AI
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenAssign(issue)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <UserCheck size={14} /> Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenBan(issue)}
                          className="btn btn-outline-danger btn-sm"
                          title="Blacklist"
                        >
                          <ShieldAlert size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
