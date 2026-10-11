// src/components/ProductGrid.jsx
// SMARTIFY - Responsive Quick-Commerce Product Shelf & Grid
import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], loading = false, onSelectProduct, title, subtitle }) {
  if (loading) {
    return (
      <div className="qc-section">
        {title && (
          <div className="qc-section-header">
            <h2 className="qc-section-title">{title}</h2>
          </div>
        )}
        <div className="qc-product-grid">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '280px', borderRadius: 'var(--radius-md)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--qc-border)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          margin: '2rem 0'
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
          No matching products found
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', maxWidth: '420px', margin: '0 auto' }}>
          We could not find any smart devices matching your current filter. Try resetting filters or searching for "bulb" or "plug".
        </p>
      </div>
    );
  }

  return (
    <section className="qc-section">
      {title && (
        <div className="qc-section-header">
          <div className="qc-section-title-wrap">
            <h2 className="qc-section-title">{title}</h2>
            {subtitle && <span className="qc-section-sub">{subtitle}</span>}
          </div>
        </div>
      )}
      <div className="qc-product-grid">
        {products.map((p, idx) => (
          <ProductCard
            key={p.id}
            product={p}
            onSelect={onSelectProduct}
            eager={idx < 6}
          />
        ))}
      </div>
    </section>
  );
}
