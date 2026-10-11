// src/components/MobileStickyCart.jsx
// SMARTIFY - Quick-Commerce Mobile Sticky Cart Floating Bar
import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function MobileStickyCart() {
  const { itemCount, cartTotals, openCart } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="qc-mobile-cart-bar">
      <button
        type="button"
        className="qc-mobile-cart-btn"
        onClick={openCart}
        aria-label="View shopping cart"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.35rem', borderRadius: '50%', display: 'flex' }}>
            <ShoppingCart size={18} color="#ffffff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 900 }}>
              ₹{(cartTotals.total || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 800 }}>
          <span>View Cart</span>
          <ArrowRight size={17} />
        </div>
      </button>
    </div>
  );
}
