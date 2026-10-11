// src/components/AuthModal.jsx
// SMARTIFY - Authentication Modal with Google OAuth & Indian Phone OTP
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Smartphone,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register, loginWithToken } = useAuth();

  // Active Tab: 'phone' (Default Indian Quick-Commerce) | 'email' | 'register'
  const [activeTab, setActiveTab] = useState('phone');

  // Phone OTP Flow States
  // 'enter_phone' | 'enter_otp'
  const [otpStep, setOtpStep] = useState('enter_phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpFullName, setOtpFullName] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Email/Password States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Google OAuth States
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, client_id: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnContainerRef = useRef(null);

  // General Status States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const cooldownIntervalRef = useRef(null);

  // Load Google OAuth Configuration
  useEffect(() => {
    let mounted = true;
    api.getGoogleConfig()
      .then((cfg) => {
        if (mounted && cfg) {
          setGoogleConfig(cfg);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Initialize official Google Identity Services script when modal opens
  useEffect(() => {
    if (!isAuthModalOpen || !googleConfig.enabled || !googleConfig.client_id) return;

    function handleGoogleCallback(response) {
      if (!response.credential) return;
      setGoogleLoading(true);
      setErrorMsg('');

      api.verifyGoogleToken(response.credential)
        .then((data) => {
          loginWithToken(data.token, data.user);
          closeAuthModal();
        })
        .catch((err) => {
          setErrorMsg(err.message || 'Google authentication failed.');
        })
        .finally(() => {
          setGoogleLoading(false);
        });
    }

    // Load Google script dynamically
    if (typeof window.google === 'undefined' || !window.google.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleConfig.client_id,
            callback: handleGoogleCallback,
            auto_select: false
          });
          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with'
            });
          }
        }
      };
      document.body.appendChild(script);
    } else {
      window.google.accounts.id.initialize({
        client_id: googleConfig.client_id,
        callback: handleGoogleCallback,
        auto_select: false
      });
      if (googleBtnContainerRef.current) {
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with'
        });
      }
    }
  }, [isAuthModalOpen, googleConfig, loginWithToken, closeAuthModal]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [cooldownSeconds]);

  if (!isAuthModalOpen) return null;

  const resetAllErrors = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Google Sign-In Click Handler
  const handleGoogleBtnClick = () => {
    resetAllErrors();
    if (!googleConfig.enabled || !googleConfig.client_id) {
      setErrorMsg(
        'Google OAuth requires setup: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file or Render dashboard.'
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google Sign-In SDK is loading. Please try again in a moment.');
    }
  };

  // PHONE OTP: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    resetAllErrors();

    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone[0])) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleanPhone);
      setSuccessMsg(res.message || 'OTP sent successfully!');
      setCooldownSeconds(res.cooldown_seconds || 60);
      setOtpStep('enter_otp');
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  // PHONE OTP: Resend OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;
    await handleSendOtp();
  };

  // PHONE OTP: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetAllErrors();

    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp({
        phone: phoneInput.replace(/\D/g, ''),
        otp: cleanOtp,
        full_name: otpFullName.trim()
      });
      loginWithToken(res.token, res.user);
      closeAuthModal();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    resetAllErrors();
    setLoading(true);

    try {
      if (activeTab === 'email') {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, phone: regPhone });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setActiveTab('email');
    setEmail(demoEmail);
    setPassword(demoPass);
    resetAllErrors();
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div className="modal-content-card" style={{ maxWidth: '440px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid var(--qc-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--qc-dark)', margin: 0 }}>
              {activeTab === 'phone'
                ? (otpStep === 'enter_phone' ? 'Fast Mobile Sign-In' : 'Enter Verification OTP')
                : activeTab === 'email'
                ? 'Sign In with Email'
                : 'Create SMARTIFY Account'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--qc-muted)' }}>
              Smart Living. Simple Prices. &bull; SMARTIFY India
            </span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            style={{ background: 'none', border: 'none', color: 'var(--qc-muted)', cursor: 'pointer', padding: '0.3rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--qc-border)', backgroundColor: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('phone'); resetAllErrors(); }}
            style={{
              flex: 1.2,
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: activeTab === 'phone' ? 'var(--qc-green)' : 'var(--qc-muted)',
              borderBottom: activeTab === 'phone' ? '2.5px solid var(--qc-green)' : 'none',
              backgroundColor: activeTab === 'phone' ? '#ffffff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Smartphone size={14} /> Phone OTP
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('email'); resetAllErrors(); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: activeTab === 'email' ? 'var(--qc-green)' : 'var(--qc-muted)',
              borderBottom: activeTab === 'email' ? '2.5px solid var(--qc-green)' : 'none',
              backgroundColor: activeTab === 'email' ? '#ffffff' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Mail size={14} /> Email
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); resetAllErrors(); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: activeTab === 'register' ? 'var(--qc-green)' : 'var(--qc-muted)',
              borderBottom: activeTab === 'register' ? '2.5px solid var(--qc-green)' : 'none',
              backgroundColor: activeTab === 'register' ? '#ffffff' : 'transparent'
            }}
          >
            Register
          </button>
        </div>

        <div style={{ padding: '1.35rem' }}>
          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 0.85rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', color: '#15803d', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: PHONE OTP AUTHENTICATION */}
          {activeTab === 'phone' && (
            <div>
              {otpStep === 'enter_phone' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.35rem' }}>
                      Indian Mobile Number (10 Digits)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem', backgroundColor: '#ffffff' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--qc-dark)', paddingRight: '0.5rem', borderRight: '1px solid var(--qc-border)' }}>
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        style={{ border: 'none', background: 'transparent', marginLeft: '0.6rem', width: '100%', fontSize: '0.95rem', fontWeight: 700 }}
                        required
                        autoFocus
                      />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--qc-muted)', marginTop: '0.3rem', display: 'block' }}>
                      We will dispatch a secure 6-digit one-time password (OTP).
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="qc-add-btn"
                    style={{
                      padding: '0.8rem',
                      backgroundColor: 'var(--qc-green)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {loading ? 'Sending OTP...' : 'Send OTP &rarr;'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--qc-muted)' }}>
                      Sent to <strong>+91 {phoneInput}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('enter_phone'); resetAllErrors(); }}
                      style={{ background: 'none', border: 'none', color: 'var(--qc-green)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.35rem' }}>
                      Enter 6-Digit OTP Code
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--qc-green-border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem', backgroundColor: '#f0fdf4' }}>
                      <KeyRound size={18} color="var(--qc-green)" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        style={{ border: 'none', background: 'transparent', marginLeft: '0.6rem', width: '100%', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.3em' }}
                        required
                        autoFocus
                      />
                    </div>
                    {devOtpHint && (
                      <span style={{ fontSize: '0.74rem', color: '#047857', marginTop: '0.3rem', display: 'block', fontWeight: 600 }}>
                        Development test OTP: <strong>{devOtpHint}</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.25rem' }}>
                      Full Name (Optional for new user)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={otpFullName}
                      onChange={(e) => setOtpFullName(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="qc-add-btn"
                    style={{
                      padding: '0.8rem',
                      backgroundColor: 'var(--qc-green)',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      fontWeight: 800
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
                    {cooldownSeconds > 0 ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--qc-muted)' }}>
                        Resend OTP in <strong>{cooldownSeconds}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        style={{ background: 'none', border: 'none', color: 'var(--qc-green)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <RefreshCw size={12} /> Resend OTP Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2 & 3: EMAIL / PASSWORD */}
          {activeTab !== 'phone' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeTab === 'register' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.25rem' }}>
                      Full Name *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                      <User size={16} color="var(--qc-muted)" />
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
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.25rem' }}>
                      Mobile Number (10 Digits)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                      <Phone size={16} color="var(--qc-muted)" />
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9811223344"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', width: '100%', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.25rem' }}>
                  Email Address *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                  <Mail size={16} color="var(--qc-muted)" />
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
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', display: 'block', marginBottom: '0.25rem' }}>
                  Password *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                  <Lock size={16} color="var(--qc-muted)" />
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

              <button
                type="submit"
                disabled={loading}
                className="qc-add-btn"
                style={{
                  marginTop: '0.4rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--qc-green)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                {loading ? 'Processing...' : (activeTab === 'email' ? 'Sign In with Email' : 'Create Account')}
              </button>
            </form>
          )}

          {/* DIVIDER */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--qc-border)' }} />
            <span style={{ padding: '0 0.6rem', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--qc-muted)', fontWeight: 700 }}>
              Or Continue With
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--qc-border)' }} />
          </div>

          {/* GOOGLE SIGN-IN BUTTON (PHASE 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div ref={googleBtnContainerRef} style={{ minHeight: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {/* Fallback button if Google GIS hasn't rendered custom button yet */}
              <button
                type="button"
                onClick={handleGoogleBtnClick}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #dadce0',
                  borderRadius: 'var(--radius-sm)',
                  color: '#3c4043',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
              </button>
            </div>
            {!googleConfig.enabled && (
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'center' }}>
                Note: Configure GOOGLE_CLIENT_ID in .env for production Google OAuth
              </span>
            )}
          </div>

          {/* Quick Demo Credentials */}
          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--qc-border)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--qc-muted)', fontWeight: 700, marginBottom: '0.45rem' }}>
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
