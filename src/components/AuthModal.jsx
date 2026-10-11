// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' or 'register'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, phone });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="modal-content-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-charcoal-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {tab === 'login' ? 'Sign In to SMARTIFY' : 'Create SMARTIFY Account'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-500)' }}>
              {tab === 'login' ? 'Smart Living. Simple Prices.' : 'Smart Home, Smarter Living.'}
            </span>
          </div>
          <button type="button" onClick={closeAuthModal} style={{ color: 'var(--color-charcoal-500)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-charcoal-200)' }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: tab === 'login' ? 'var(--color-primary)' : 'var(--color-charcoal-500)',
              borderBottom: tab === 'login' ? '2px solid var(--color-primary)' : 'none',
              backgroundColor: tab === 'login' ? '#ffffff' : '#f8fafc'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: tab === 'register' ? 'var(--color-primary)' : 'var(--color-charcoal-500)',
              borderBottom: tab === 'register' ? '2px solid var(--color-primary)' : 'none',
              backgroundColor: tab === 'register' ? '#ffffff' : '#f8fafc'
            }}
          >
            Register (नया खाता)
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.8rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {tab === 'register' && (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal-700)', display: 'block', marginBottom: '0.25rem' }}>
                    Full Name (पूरा नाम)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                    <User size={16} color="var(--color-charcoal-400)" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal-700)', display: 'block', marginBottom: '0.25rem' }}>
                    Mobile Number (10 Digits)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                    <Phone size={16} color="var(--color-charcoal-400)" />
                    <input
                      type="tel"
                      placeholder="e.g. 9811223344"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal-700)', display: 'block', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                <Mail size={16} color="var(--color-charcoal-400)" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-charcoal-700)', display: 'block', marginBottom: '0.25rem' }}>
                Password (पासवर्ड)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                <Lock size={16} color="var(--color-charcoal-400)" />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
              {loading ? 'Processing...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-charcoal-200)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-charcoal-500)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Quick Demo Accounts (1-Click Fill)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => fillQuickDemo('rahul@gmail.com', 'password123')}
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', cursor: 'pointer' }}
              >
                👤 Customer (Rahul)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@smartify.in', 'admin123')}
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', fontWeight: 600 }}
              >
                🛡️ Admin Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
