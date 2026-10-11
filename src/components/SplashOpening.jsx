// src/components/SplashOpening.jsx
// SMARTIFY - Premium Quick-Commerce Opening Experience
import React, { useState, useEffect } from 'react';

export default function SplashOpening({ onFinish }) {
  const [stage, setStage] = useState('intro'); // 'intro', 'tagline', 'fading', 'done'
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 1. Accessibility: Skip immediately if reduced motion is requested
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasSeenSplash = sessionStorage.getItem('smartify_splash_seen');

    if (prefersReducedMotion || hasSeenSplash) {
      setIsVisible(false);
      if (onFinish) onFinish();
      return;
    }

    // 2. Mark as seen in this browser session so it doesn't trigger on internal navigation
    sessionStorage.setItem('smartify_splash_seen', 'true');

    // 3. Smooth animation sequence (~1.8 seconds total)
    const taglineTimer = setTimeout(() => {
      setStage('tagline');
    }, 450);

    const fadeTimer = setTimeout(() => {
      setStage('fading');
    }, 1450);

    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 1850);

    // Non-blocking failsafe timer (dismisses after 2.4s even if browser stalls)
    const failsafeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 2400);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      clearTimeout(failsafeTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    setIsVisible(false);
    sessionStorage.setItem('smartify_splash_seen', 'true');
    if (onFinish) onFinish();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`smartify-splash-overlay ${stage === 'fading' ? 'smartify-splash-fadeout' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="SMARTIFY loading"
    >
      <div className="smartify-splash-content">
        {/* Animated Brand Emblem & Smart-Home Package */}
        <div className="smartify-splash-emblem-wrap">
          <div className="smartify-splash-emblem-glow" />
          <svg
            className="smartify-splash-icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Smart Home Base & Package Geometry */}
            <rect x="8" y="20" width="48" height="36" rx="8" fill="#111827" stroke="#F59E0B" strokeWidth="2.5" />
            <path d="M4 22L32 4L60 22" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Smart WiFi / Signal Waves */}
            <path d="M22 15C25.5 12 38.5 12 42 15" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <path d="M26 18C28 16 36 16 38 18" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            {/* Glowing Hub Center */}
            <circle cx="32" cy="38" r="6" fill="#F59E0B" />
            <circle cx="32" cy="38" r="10" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
            {/* Express lightning bolt inside */}
            <path d="M31 33L29 38H33L32 43L36 38H32L34 33H31Z" fill="#111827" />
          </svg>
        </div>

        {/* Brand Name */}
        <div className="smartify-splash-title">
          <span className="smartify-splash-brand">SMARTIFY</span>
          <span className="smartify-splash-badge">EXPRESS</span>
        </div>

        {/* Taglines */}
        <div className={`smartify-splash-taglines ${stage === 'tagline' || stage === 'fading' ? 'smartify-taglines-show' : ''}`}>
          <div className="smartify-splash-tagline-main">
            Smart Living. Simple Prices.
          </div>
          <div className="smartify-splash-tagline-sub">
            Smart essentials, delivered fast.
          </div>
        </div>

        {/* Micro-Progress Bar & Skip Button */}
        <div className="smartify-splash-progress-track">
          <div className="smartify-splash-progress-bar" />
        </div>

        <button
          type="button"
          className="smartify-splash-skip-btn"
          onClick={handleSkip}
          aria-label="Skip opening animation"
        >
          Skip &rarr;
        </button>
      </div>
    </div>
  );
}
