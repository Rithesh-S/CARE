import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Cpu, Menu, X, AlertTriangle } from 'lucide-react';

export const Navbar = ({ urgentCount = 0, mobileSidebarOpen = false, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-navbar)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
    }}>
      {/* University Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: mobileSidebarOpen ? '#eef2ff' : '#ffffff',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          {mobileSidebarOpen ? <X size={20} color="#4f46e5" /> : <Menu size={20} />}
        </button>

        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
          flexShrink: 0
        }}>
          <ShieldCheck size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              CARE
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: '#eef2ff',
              color: '#4338ca',
              border: '1px solid #c7d2fe',
              letterSpacing: '0.04em'
            }}>
              SKCET COMMAND
            </span>
          </div>
          <p className="navbar-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Sri Krishna College of Engineering & Technology • Incident Intelligence
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Urgent Live Alert Pill */}
        {urgentCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '9999px',
            background: '#fef2f2',
            border: '1px solid #fecdd3',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#e11d48'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#e11d48'
            }} />
            <span className="urgent-badge-text">{urgentCount} Urgent</span>
          </div>
        )}

        {/* Visual AI Engine Status Pill (Hidden on narrow mobile screens) */}
        <div className="ai-status-pill" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '9999px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          fontSize: '0.72rem',
          color: '#059669',
          fontWeight: 600
        }}>
          <Cpu size={13} />
          <span>Visual AI Active</span>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4338ca',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-text-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user?.name || 'Administrator'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {user?.email || 'admin@skcet.ac.in'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginLeft: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#e11d48';
              e.currentTarget.style.borderColor = '#fecdd3';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = '#f8fafc';
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
