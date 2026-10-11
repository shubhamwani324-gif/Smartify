// src/components/PincodeModal.jsx
// SMARTIFY - Delivery Location & Pincode Selector Modal
import React, { useState } from 'react';
import { X, MapPin, Zap, AlertCircle } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

const POPULAR_HUBS = [
  { pin: '110001', city: 'Delhi NCR', eta: '10 mins' },
  { pin: '201301', city: 'Noida / Greater Noida', eta: '10 mins' },
  { pin: '560001', city: 'Bengaluru', eta: '10 mins' },
  { pin: '400001', city: 'Mumbai', eta: '10 mins' },
  { pin: '500001', city: 'Hyderabad', eta: '10 mins' },
  { pin: '411001', city: 'Pune', eta: '10 mins' },
  { pin: '700001', city: 'Kolkata', eta: '1-2 days' },
  { pin: '380001', city: 'Ahmedabad', eta: '1-2 days' }
];

export default function PincodeModal() {
  const { isPincodeModalOpen, closePincodeModal, verifyAndSetPincode, pincodeData } = useLocation();
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isPincodeModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim() || pinInput.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const res = await verifyAndSetPincode(pinInput.trim());
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleSelectQuick = async (pin) => {
    setLoading(true);
    setErrorMsg('');
    await verifyAndSetPincode(pin);
    setLoading(false);
  };

  const isExpress = pincodeData.pincode?.startsWith('11') || pincodeData.pincode?.startsWith('20') || pincodeData.pincode?.startsWith('56') || pincodeData.pincode?.startsWith('40') || pincodeData.pincode?.startsWith('50') || pincodeData.pincode?.startsWith('41');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={closePincodeModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--qc-shadow-hover)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--qc-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} color="var(--qc-green)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--qc-dark)' }}>
              Choose Delivery Location
            </h3>
          </div>
          <button type="button" onClick={closePincodeModal} style={{ color: 'var(--qc-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--qc-muted)', marginBottom: '1rem' }}>
            Enter your PIN code to check instant 10-minute delivery coverage from our local fulfillment hubs.
          </p>

          <form onSubmit={handleSubmit} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter 6-digit Pincode (e.g. 110001)"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '0.65rem 0.85rem', border: '1.5px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', outline: 'none' }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.65rem 1.25rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '0.88rem' }}
              >
                {loading ? 'Checking...' : 'Check'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Selection */}
          <div style={{ backgroundColor: 'var(--qc-green-light)', border: '1px solid var(--qc-green-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--qc-green)', fontWeight: 800, letterSpacing: '0.04em' }}>
              Currently Active Location
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--qc-dark)', marginTop: '0.15rem' }}>
              {pincodeData.pincode} — {pincodeData.city}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--qc-green)', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={13} />
              <span>{isExpress ? '⚡ 10-Minute Express Delivery Active' : 'Standard Courier Delivery (1-2 Days)'}</span>
            </div>
          </div>

          {/* Popular Cities */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--qc-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              Popular Metro Express Hubs
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.pin}
                  type="button"
                  onClick={() => handleSelectQuick(hub.pin)}
                  style={{
                    padding: '0.55rem 0.75rem',
                    textAlign: 'left',
                    border: pincodeData.pincode === hub.pin ? '1.5px solid var(--qc-green)' : '1px solid var(--qc-border)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: pincodeData.pincode === hub.pin ? 'var(--qc-green-light)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--qc-dark)' }}>{hub.city}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--qc-green)', fontWeight: 600 }}>⚡ {hub.eta} • {hub.pin}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
