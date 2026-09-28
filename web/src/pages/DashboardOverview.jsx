import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckSquare, 
  Layers, 
  Globe, 
  ArrowUpRight, 
  Users, 
  TrendingUp,
  Clock,
  ShieldCheck,
  Cpu,
  MapPin,
  Calendar,
  FileSpreadsheet,
  Download,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { getImageUrl } from '../api/client';
import client from '../api/client';
import { generateAnalyticsReportPdf } from '../utils/memoPdfGenerator';

export const DashboardOverview = ({ stats, unassignedList = [], onSelectTab, onOpenAssign, onOpenReview }) => {
  // Date Range State (Max 31 days)
  const [datePreset, setDatePreset] = useState('14D'); // 'TODAY', '7D', '14D', '31D', 'CUSTOM'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Analytics Data State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [rangeError, setRangeError] = useState('');

  // Fetch Analytics
  const fetchAnalytics = async (s, e) => {
    setAnalyticsLoading(true);
    setRangeError('');
    try {
      const res = await client.get(`/api/admin/analytics?startDate=${s}&endDate=${e}`);
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setRangeError(err.response?.data?.message || 'Failed to fetch analytics for date range.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [startDate, endDate]);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const end = new Date();
    const start = new Date();

    if (preset === 'TODAY') {
      // same day
    } else if (preset === '7D') {
      start.setDate(end.getDate() - 7);
    } else if (preset === '14D') {
      start.setDate(end.getDate() - 14);
    } else if (preset === '31D') {
      start.setDate(end.getDate() - 31);
    }

    if (preset !== 'CUSTOM') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const handleCustomApply = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));

    if (diff > 31) {
      setRangeError(`Selected range (${diff} days) exceeds the maximum limit of 31 days.`);
      return;
    }
    if (diff < 0) {
      setRangeError('Start date cannot be after end date.');
      return;
    }
    fetchAnalytics(startDate, endDate);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
        border: '1.5px solid #c7d2fe',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-status-assigned">CARE OPERATIONS COMMAND</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sri Krishna College of Engineering & Technology</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Incident Intelligence & Command Overview
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
            Live triage tracking, SLA enforcement, and automated student resolution notifications active across all campus blocks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onSelectTab('grievances', 'UNASSIGNED')}
            className="btn btn-primary"
          >
            <Layers size={16} /> Open Triage Queue ({stats?.unassigned || 0})
          </button>
          {stats?.pending_review > 0 && (
            <button 
              onClick={() => onSelectTab('grievances', 'PENDING_REVIEW')}
              className="btn btn-emerald"
            >
              <CheckSquare size={16} /> Verify Resolutions ({stats.pending_review})
            </button>
          )}
          <button
            onClick={() => setReportModalOpen(true)}
            className="btn btn-secondary"
            style={{ background: '#ffffff', border: '1.5px solid #c7d2fe', color: '#4338ca' }}
          >
            <FileSpreadsheet size={16} /> Generate Date Report
          </button>
        </div>
      </div>

      {/* Expanded Metrics KPI Grid */}
      <div className="kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Urgent Unassigned */}
        <div 
          onClick={() => onSelectTab('grievances', 'UNASSIGNED')}
          className="kpi-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Urgent Incidents
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e11d48'
            }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: stats?.urgent_high_priority > 0 ? '#e11d48' : 'var(--text-primary)', marginTop: '8px' }}>
            {stats?.urgent_high_priority || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Severity score ≥ 8/10
          </div>
        </div>

        {/* Overdue SLA Tasks */}
        <div 
          onClick={() => onSelectTab('staff')}
          className="kpi-card" 
          style={{ cursor: 'pointer', borderColor: stats?.overdue_tasks > 0 ? '#fecdd3' : 'var(--border-subtle)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Overdue SLA Tasks
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#be123c'
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: stats?.overdue_tasks > 0 ? '#be123c' : 'var(--text-primary)', marginTop: '8px' }}>
            {stats?.overdue_tasks || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#be123c', marginTop: '4px', fontWeight: 600 }}>
            {stats?.overdue_tasks > 0 ? 'Eligible for Staff Memo' : 'No Overdue Tasks'}
          </div>
        </div>

        {/* Pending Review Sign-Off */}
        <div 
          onClick={() => onSelectTab('grievances', 'PENDING_REVIEW')}
          className="kpi-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Awaiting Review
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: stats?.pending_review > 0 ? '#d97706' : 'var(--text-primary)', marginTop: '8px' }}>
            {stats?.pending_review || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Resolution photo submitted
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              SLA Compliance
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
            {analytics?.summary?.sla_compliance_rate ?? 94}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Avg TAT: {analytics?.summary?.avg_resolution_time_hours ?? 18} hrs
          </div>
        </div>

        {/* Active Staff & Extensions */}
        <div 
          onClick={() => onSelectTab('staff')}
          className="kpi-card" 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Field Operations
            </div>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            {stats?.active_staff || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {stats?.pending_extensions || 0} Extension Requests
          </div>
        </div>
      </div>

      {/* Date-Wise Control Toolbar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginRight: '6px' }}>
            <Calendar size={16} color="#4f46e5" />
            <span>Date View:</span>
          </div>

          {[
            { id: 'TODAY', label: 'Today' },
            { id: '7D', label: 'Last 7 Days' },
            { id: '14D', label: 'Last 14 Days' },
            { id: '31D', label: 'Last 31 Days' },
            { id: 'CUSTOM', label: 'Custom' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: datePreset === p.id ? '1.5px solid #4f46e5' : '1px solid var(--border-subtle)',
                background: datePreset === p.id ? '#eef2ff' : '#f8fafc',
                color: datePreset === p.id ? '#4338ca' : 'var(--text-secondary)'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        {datePreset === 'CUSTOM' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            />
            <button
              onClick={handleCustomApply}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Apply Filter
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing: <strong>{startDate}</strong> to <strong>{endDate}</strong>
          </span>
          <button
            onClick={() => generateAnalyticsReportPdf(analytics)}
            disabled={!analytics || analyticsLoading}
            className="btn btn-emerald"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            title="Download PDF Report for selected range"
          >
            <Download size={14} /> PDF Report
          </button>
        </div>
      </div>

      {rangeError && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '1px solid #fecdd3',
          color: '#e11d48',
          fontSize: '0.825rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{rangeError}</span>
        </div>
      )}

      {/* Progress Classification Pipeline */}
      <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Incident Progress Classification Funnel
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Clean stage-by-stage observation of campus issues across the resolution lifecycle
            </p>
          </div>
          <span className="badge badge-status-assigned">Active Window</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px'
        }}>
          {[
            {
              stage: '1. Logged / Unassigned',
              count: analytics?.progress_classification?.reported || stats?.unassigned || 0,
              desc: 'Triaged by AI VLM or text',
              color: '#e11d48',
              bg: '#fef2f2',
              border: '#fecdd3'
            },
            {
              stage: '2. Under Field SLA',
              count: analytics?.progress_classification?.in_action || stats?.assigned_staff || 0,
              desc: 'Assigned to field staff',
              color: '#4f46e5',
              bg: '#eef2ff',
              border: '#c7d2fe'
            },
            {
              stage: '3. Proof Under Review',
              count: analytics?.progress_classification?.under_review || stats?.pending_review || 0,
              desc: 'After photo uploaded',
              color: '#d97706',
              bg: '#fffbeb',
              border: '#fed7aa'
            },
            {
              stage: '4. Verified & Resolved',
              count: analytics?.progress_classification?.resolved || stats?.posted || 0,
              desc: 'Notified to student',
              color: '#059669',
              bg: '#ecfdf5',
              border: '#a7f3d0'
            },
            {
              stage: '5. Archived / Rejected',
              count: analytics?.progress_classification?.archived || stats?.archived || 0,
              desc: 'Spam or non-actionable',
              color: '#64748b',
              bg: '#f8fafc',
              border: '#e2e8f0'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: item.bg,
                border: `1px solid ${item.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.color, textTransform: 'uppercase' }}>
                {item.stage}
              </span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: item.color }}>
                {item.count}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Date-Wise Issue Progression Table */}
      <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Date-Wise Daily Activity & Progress Ledger
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Daily progression breakdown of reported vs resolved campus grievances
            </p>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Max Range: 31 Days
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>New Grievances</th>
                <th>Unassigned</th>
                <th>Assigned Staff</th>
                <th>Under Review</th>
                <th>Resolved & Notified</th>
                <th>SLA Breaches</th>
              </tr>
            </thead>
            <tbody>
              {(!analytics?.date_wise_timeline || analytics.date_wise_timeline.length === 0) ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No incident activity recorded for the selected date window.
                  </td>
                </tr>
              ) : (
                analytics.date_wise_timeline.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {row.display_date || row.date}
                    </td>
                    <td>
                      <span className="badge badge-status-assigned" style={{ fontSize: '0.75rem' }}>
                        {row.reported} Reported
                      </span>
                    </td>
                    <td>
                      {row.unassigned > 0 ? (
                        <span style={{ color: '#e11d48', fontWeight: 700 }}>{row.unassigned}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: '#4338ca', fontWeight: 600 }}>{row.assigned_staff}</span>
                    </td>
                    <td>
                      {row.pending_review > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 700 }}>{row.pending_review}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td>
                      {row.resolved > 0 ? (
                        <span style={{ color: '#059669', fontWeight: 800 }}>+{row.resolved} Resolved</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0</span>
                      )}
                    </td>
                    <td>
                      {row.overdue > 0 ? (
                        <span className="badge badge-status-unassigned" style={{ fontSize: '0.7rem' }}>
                          {row.overdue} Overdue
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontSize: '0.78rem' }}>✓ On Track</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Category Distribution & Block Hotspots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Category Breakdown */}
        <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Incident Category Breakdown
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Distribution across student textual selections and ML classifications
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(analytics?.category_breakdown || {}).length === 0 ? (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No category data for current window.
              </div>
            ) : (
              Object.entries(analytics?.category_breakdown || {}).map(([cat, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: '#f8fafc' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {cat}
                  </span>
                  <span className="badge badge-status-assigned" style={{ fontSize: '0.75rem' }}>
                    {count} incident{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campus Block Hotspots */}
        <div className="glass-panel" style={{ padding: '22px', background: '#ffffff' }}>
          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Campus Block & Zone Hotspots
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Incidents filtered and classified by scanned block QR and zone tags
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(analytics?.block_hotspots || {}).length === 0 ? (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No hotspot data for current window.
              </div>
            ) : (
              Object.entries(analytics?.block_hotspots || {}).map(([block, count], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#0284c7" />
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {block}
                    </span>
                  </div>
                  <span className="badge badge-status-unassigned" style={{ fontSize: '0.75rem' }}>
                    {count} incidents
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Date Range Report Modal (Max 31 Days) */}
      {reportModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1.5px solid #c7d2fe',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={24} color="#4f46e5" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Executive Incident Report Generator
                </h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Specify a campus observation window up to 31 days to generate and download a comprehensive executive analytics report in PDF format.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Start Date:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.825rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  End Date:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 10px', fontSize: '0.825rem' }}
                />
              </div>
            </div>

            {analytics?.summary && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                fontSize: '0.825rem'
              }}>
                <div>Total Incidents: <strong>{analytics.summary.total_incidents}</strong></div>
                <div>Resolved & Verified: <strong>{analytics.summary.total_resolved}</strong></div>
                <div>SLA Compliance: <strong>{analytics.summary.sla_compliance_rate}%</strong></div>
                <div>Avg Resolution TAT: <strong>{analytics.summary.avg_resolution_time_hours} hrs</strong></div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="btn"
                style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  generateAnalyticsReportPdf(analytics);
                  setReportModalOpen(false);
                }}
                className="btn btn-emerald"
              >
                <Download size={16} /> Download Official PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
