import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  ShieldAlert, 
  Send,
  Camera,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar = ({ currentTab, setTab, stats, isOpen = false, onClose }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Command Overview',
      icon: <LayoutDashboard size={18} />,
      badge: null
    },
    {
      id: 'grievances',
      label: 'Grievance Triage & Ledger',
      icon: <Layers size={18} />,
      badge: stats?.unassigned > 0 ? `${stats.unassigned} Urgent` : stats?.total || null,
      badgeColor: stats?.unassigned > 0 ? 'badge-status-unassigned' : 'badge-status-assigned'
    },
    {
      id: 'staff',
      label: 'Staff & SLA Operations',
      icon: <Users size={18} />,
      badge: stats?.overdue_tasks > 0 ? `${stats.overdue_tasks} Overdue` : (stats?.active_staff || null),
      badgeColor: stats?.overdue_tasks > 0 ? 'badge-status-unassigned' : 'badge-status-assigned'
    },
    {
      id: 'security',
      label: 'Security & Spam Control',
      icon: <ShieldAlert size={18} />,
      badge: stats?.banned_students > 0 ? stats.banned_students : null,
      badgeColor: 'badge-status-unassigned'
    },
    {
      id: 'public_feed',
      label: 'Resolution Direct Alerts',
      icon: <Send size={18} />,
      badge: stats?.posted || null,
      badgeColor: 'badge-status-posted'
    }
  ];

  const handleItemClick = (id) => {
    setTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="mobile-sidebar-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 48
          }}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} style={{
        width: '260px',
        background: '#ffffff',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: '6px',
        height: 'calc(100vh - 68px)',
        position: 'sticky',
        top: '68px',
        overflowY: 'auto',
        zIndex: 49,
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px 6px'
        }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)'
          }}>
            CARE Operations Portals
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="mobile-sidebar-close-btn"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                background: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#4338ca' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.86rem',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: isActive ? '#4f46e5' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge !== null && (
                <span className={`badge ${item.badgeColor}`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', padding: '16px 8px 4px' }}>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            lineHeight: '1.45'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              <Camera size={14} color="#059669" />
              <span>CARE Integrity Guard</span>
            </div>
            <div>Strict live sensor validation. SHA-256 HMAC student privacy hashing active.</div>
          </div>
        </div>
      </aside>
    </>
  );
};
