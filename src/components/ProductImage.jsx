// src/components/ProductImage.jsx
// Reusable, fault-tolerant product image component with aspect ratio protection,
// skeleton loading state, fallback category badges, and infinite error loop prevention.

import React, { useState, useEffect } from 'react';
import { resolveProductImage, CATEGORY_FALLBACK_ICONS } from '../utils/productImages';

export default function ProductImage({
  productId,
  src,
  alt = 'Product image',
  categorySlug = 'smart-lighting',
  className = '',
  aspectRatio = '1 / 1',
  fit = 'contain', // 'contain' for electronics photography, 'cover' for lifestyle
  eager = false,
  onClick
}) {
  // Resolve primary image candidate: preference for local verified registry asset
  const primarySrc = resolveProductImage(productId, src);

  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorRetried, setErrorRetried] = useState(false);

  useEffect(() => {
    const nextSrc = resolveProductImage(productId, src);
    setCurrentSrc(nextSrc);
    setLoading(true);
    setHasError(false);
    setErrorRetried(false);
  }, [productId, src]);

  const handleLoad = () => {
    setLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    // If not retried yet and currentSrc was something other than the registry, try registry once
    const fallbackRegistrySrc = resolveProductImage(productId, null);
    if (!errorRetried && fallbackRegistrySrc && currentSrc !== fallbackRegistrySrc) {
      setErrorRetried(true);
      setCurrentSrc(fallbackRegistrySrc);
      return;
    }

    // Terminal fallback state: stop loading, flag error, do not loop
    setLoading(false);
    setHasError(true);
  };

  const categoryMeta = CATEGORY_FALLBACK_ICONS[categorySlug] || {
    icon: '⚡',
    label: 'Smart Device',
    bg: '#f1f5f9',
    color: '#475569'
  };

  return (
    <div
      className={`product-image-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        backgroundColor: '#f8fafc',
        borderRadius: 'inherit',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClick}
    >
      {/* Loading Skeleton Shimmer */}
      {loading && !hasError && (
        <div
          className="skeleton product-image-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1
          }}
          aria-hidden="true"
        />
      )}

      {/* Actual Product Image */}
      {!hasError && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fit,
            padding: fit === 'contain' ? '8px' : '0',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.2s ease, transform 0.25s ease',
            zIndex: 2
          }}
          className="product-img-element"
        />
      ) : (
        /* Neutral Designed Fallback */
        <div
          className="product-image-fallback"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '1rem',
            textAlign: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: categoryMeta.bg,
            color: categoryMeta.color,
            zIndex: 2
          }}
          role="img"
          aria-label={`${alt} (Photo currently unavailable)`}
        >
          <span style={{ fontSize: '2.2rem', lineHeight: 1 }} aria-hidden="true">
            {categoryMeta.icon}
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {categoryMeta.label}
          </span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 500 }}>
            SMARTIFY Verified Device
          </span>
        </div>
      )}
    </div>
  );
}
