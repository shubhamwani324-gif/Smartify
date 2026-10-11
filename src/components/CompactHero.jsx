// src/components/CompactHero.jsx
// SMARTIFY - Quick-Commerce Hero Banner (Blinkit-inspired Yellow & Emerald Base)
import React from 'react';
import { Zap, ShieldCheck, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react';

export default function CompactHero({ onShopNow }) {
  return (
    <div className="qc-hero-banner">
      <div className="qc-hero-content">
        <div className="qc-hero-badge">
          <Zap size={14} fill="#ffffff" /> 10-Minute Smart Home Essentials
        </div>
        <h1 className="qc-hero-title">
          Ghar Ko Smart Banao,<br />Budget Ke Andar.
        </h1>
        <p className="qc-hero-desc">
          Top-rated Wi-Fi smart bulbs, high-load plugs, 360° security cameras, and sensors delivered to your doorstep in minutes.
        </p>

        <div className="qc-hero-features">
          <div className="qc-hero-feature-item">
            <Zap size={15} /> 10-Min Fast Delivery*
          </div>
          <div className="qc-hero-feature-item">
            <ShieldCheck size={15} /> 1-Year Warranty
          </div>
          <div className="qc-hero-feature-item">
            <CheckCircle2 size={15} /> 100% Genuine Brands
          </div>
          <div className="qc-hero-feature-item">
            <CreditCard size={15} /> Secure Razorpay (UPI & Cards)
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 2 }}>
        <button
          type="button"
          onClick={onShopNow}
          style={{
            backgroundColor: 'var(--qc-dark)',
            color: '#ffffff',
            padding: '0.85rem 1.6rem',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.95rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            whiteSpace: 'nowrap'
          }}
        >
          Explore Smart Catalog <ArrowRight size={17} />
        </button>
        <span style={{ fontSize: '0.68rem', color: 'var(--qc-muted)', fontWeight: 600 }}>
          *10-min delivery active in supported dark store clusters
        </span>
      </div>
    </div>
  );
}
