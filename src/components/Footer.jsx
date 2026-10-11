// src/components/Footer.jsx
// SMARTIFY - Quick-Commerce Modern Footer
import React from 'react';
import { ShieldCheck, Zap, Headphones, Heart, CreditCard, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="qc-footer">
      <div className="qc-footer-inner">
        <div className="qc-footer-grid">
          {/* Col 1: Brand & Tagline */}
          <div className="qc-footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--qc-yellow)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem'
                }}
              >
                ⚡
              </div>
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--qc-dark)', letterSpacing: '-0.02em' }}>
                  SMARTIFY
                </span>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--qc-green)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Smart Living. Simple Prices.
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--qc-muted)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              India's quick smart-home destination. Reliable Wi-Fi bulbs, high-load plugs, 360° security cameras, and sensors delivered in 10 minutes in supported express dark store clusters.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--qc-green)', fontWeight: 700 }}>
              <Zap size={14} /> 10-Minute Delivery where operationally supported
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="qc-footer-col">
            <h4>Quick Categories</h4>
            <ul className="qc-footer-links">
              <li><a href="#catalog-shelves">Smart Lighting (B22)</a></li>
              <li><a href="#catalog-shelves">Smart Plugs (16A / 10A)</a></li>
              <li><a href="#catalog-shelves">Home Security & CCTV</a></li>
              <li><a href="#catalog-shelves">Sensors & Automation</a></li>
              <li><a href="#catalog-shelves">Combo Starter Kits</a></li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Policies */}
          <div className="qc-footer-col">
            <h4>Help & Policies</h4>
            <ul className="qc-footer-links">
              <li><a href="#support">7-Day Easy Returns</a></li>
              <li><a href="#warranty">1-Year Brand Warranty</a></li>
              <li><a href="#delivery">Delivery Coverage</a></li>
              <li><a href="#privacy">Privacy & Terms</a></li>
              <li><a href="#support">Customer Support 24x7</a></li>
            </ul>
          </div>

          {/* Col 4: Razorpay Security */}
          <div className="qc-footer-col">
            <h4>100% Secure Payments</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--qc-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
              Protected by <strong>Razorpay Standard Gateway</strong> with 256-bit SSL encryption.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.72rem', background: 'var(--qc-bg-page)', border: '1px solid var(--qc-border)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>UPI (GPay / PhonePe / Paytm)</span>
              <span style={{ fontSize: '0.72rem', background: 'var(--qc-bg-page)', border: '1px solid var(--qc-border)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>RuPay / Visa / Mastercard</span>
              <span style={{ fontSize: '0.72rem', background: 'var(--qc-bg-page)', border: '1px solid var(--qc-border)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>NetBanking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--qc-muted)' }}>
              <Lock size={13} color="var(--qc-green)" /> PCI-DSS Level 1 Compliant Checkout
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="qc-footer-bottom">
          <div>
            © 2026 SMARTIFY Technologies India Pvt. Ltd. • “Smart Living. Simple Prices.”
          </div>
          <div>
            Built with care for everyday Indian homes 🇮🇳
          </div>
        </div>
      </div>
    </footer>
  );
}
