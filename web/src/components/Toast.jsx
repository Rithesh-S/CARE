import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const styles = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', icon: <CheckCircle2 size={20} color="#059669" /> },
    error: { bg: '#fef2f2', border: '#fecdd3', text: '#9f1239', icon: <AlertCircle size={20} color="#e11d48" /> },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: <AlertTriangle size={20} color="#d97706" /> },
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: <Info size={20} color="#2563eb" /> }
  };

  const current = styles[toast.type || 'info'];

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 20px',
      borderRadius: '12px',
      border: `1.5px solid ${current.border}`,
      background: current.bg,
      color: current.text,
      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {current.icon}
      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{toast.message}</div>
      <button 
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: current.text,
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '8px',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
