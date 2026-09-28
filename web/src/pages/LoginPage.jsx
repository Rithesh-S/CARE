import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    setError('');

    try {
      await login({
        email: emailInput.trim(),
        name: nameInput.trim() || 'Campus Administrator'
      });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 20%, rgba(79, 70, 229, 0.08) 0%, transparent 60%), #f8fafc'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        padding: '40px',
        borderRadius: '24px',
        background: '#ffffff',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
          }}>
            <ShieldCheck size={34} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            CARE Command Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            SKCET Campus Autonomous Reporting & Escalation System
          </p>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            fontSize: '0.75rem',
            color: '#4338ca',
            fontWeight: 700
          }}>
            <Lock size={12} /> Restricted Authority Access
          </div>
        </div>

        {error && (
          <div style={{
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '10px',
            background: '#fef2f2',
            border: '1px solid #fecdd3',
            color: '#e11d48',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Admin Email Address
            </label>
            <input
              type="email"
              required
              className="search-input"
              style={{ paddingLeft: '14px' }}
              placeholder="e.g. principal@skcet.ac.in"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Full Name / Designation
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '14px' }}
              placeholder="e.g. Dr. Campus Administrator"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              fontSize: '0.95rem'
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Enter Command Center <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Credentials */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Quick Admin Profiles
          </span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEmailInput('admin@skcet.ac.in');
                setNameInput('Principal / Dean of Administration');
              }}
            >
              Principal Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEmailInput('estate.officer@skcet.ac.in');
                setNameInput('Chief Facilities Director');
              }}
            >
              Facilities Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
