// src/pages/WishlistPage.jsx
// SMARTIFY - Quick-Commerce Wishlist Page
import React from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

export default function WishlistPage({ onBackToShopping, onSelectProduct }) {
  const { wishlistProducts, wishlistCount } = useWishlist();

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={onBackToShopping}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--qc-dark)', fontWeight: 700, fontSize: '0.88rem' }}
        >
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--qc-dark)' }}>
        <Heart size={24} color="var(--qc-danger)" fill="var(--qc-danger)" /> My Wishlist ({wishlistCount} saved items)
      </h1>

      {wishlistCount === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem 1.5rem', textAlign: 'center', boxShadow: 'var(--qc-shadow-sm)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🤍</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
            Your Wishlist is Empty
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
            Save smart home devices you love to buy them later with 10-minute instant delivery.
          </p>
          <button
            type="button"
            className="qc-add-btn"
            style={{ padding: '0.75rem 1.75rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-full)' }}
            onClick={onBackToShopping}
          >
            Explore Smart Devices
          </button>
        </div>
      ) : (
        <div className="qc-product-grid">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}
