// src/pages/CartPage.jsx
// SMARTIFY - Quick-Commerce Full Cart Page
import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, Tag, Zap, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { resolveProductImage } from '../utils/productImages';

export default function CartPage({ onBackToShopping, onProceedToCheckout }) {
  const {
    items,
    itemCount,
    cartTotals,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  const handleApply = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
    }
  };

  if (itemCount === 0) {
    return (
      <div className="main-content" style={{ maxWidth: '560px', marginTop: '3rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem 1.5rem', boxShadow: 'var(--qc-shadow-sm)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🛒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
            Your Cart is Empty
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
            Add smart bulbs, plugs, and cameras to enjoy 10-minute delivery.
          </p>
          <button
            type="button"
            className="qc-add-btn"
            style={{ padding: '0.75rem 1.75rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-full)' }}
            onClick={onBackToShopping}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '1080px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onBackToShopping}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--qc-dark)', fontWeight: 700, fontSize: '0.86rem' }}
        >
          <ArrowLeft size={16} /> Continue Shopping
        </button>
        <button
          type="button"
          onClick={clearCart}
          style={{ fontSize: '0.8rem', color: 'var(--qc-danger)', fontWeight: 700 }}
        >
          Clear Cart
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--qc-dark)' }}>
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--qc-green-light)', color: 'var(--qc-green)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-xs)', fontSize: '0.76rem', fontWeight: 800 }}>
          <Zap size={13} /> 10-Min Delivery
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: Items List */}
        <div className="qc-card-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => {
              const itemId = item.product_id || item.id;
              const imgSrc = resolveProductImage(itemId, item.image_url);

              return (
                <div
                  key={itemId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--qc-border-light)'
                  }}
                >
                  <img
                    src={imgSrc || '/products/p-01.jpg'}
                    alt={item.product_name}
                    style={{ width: '68px', height: '68px', objectFit: 'contain', padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--qc-bg-page)', border: '1px solid var(--qc-border)' }}
                    onError={(e) => { e.currentTarget.src = '/products/p-01.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--qc-muted)', textTransform: 'uppercase' }}>
                      {item.brand}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                      {item.product_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--qc-dark)' }}>
                        ₹{Number(item.selling_price).toLocaleString('en-IN')}
                      </span>
                      {item.mrp && item.mrp > item.selling_price && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--qc-muted)', textDecoration: 'line-through' }}>
                          ₹{Number(item.mrp).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="qc-qty-stepper">
                    <button
                      type="button"
                      className="qc-stepper-btn"
                      onClick={() => updateQuantity(itemId, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <span className="qc-stepper-num">{item.quantity}</span>
                    <button
                      type="button"
                      className="qc-stepper-btn"
                      onClick={() => updateQuantity(itemId, item.quantity + 1)}
                      disabled={item.quantity >= (item.stock || 99)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary & Pay */}
        <div>
          {/* Coupon */}
          <div className="qc-card-panel" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--qc-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Tag size={15} color="var(--qc-green)" /> Apply Coupon
            </div>
            {cartTotals.coupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--qc-green-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-green-border)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--qc-green)' }}>
                  '{cartTotals.coupon.code}' applied (-₹{cartTotals.coupon_discount})
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  style={{ fontSize: '0.75rem', color: 'var(--qc-danger)', fontWeight: 800 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. SMARTIFY100"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
                />
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--qc-dark)', color: '#ffffff', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 800 }}
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Bill Summary */}
          <div className="qc-card-panel">
            <h3 className="qc-panel-title">Bill Details</h3>
            <div className="qc-bill-card" style={{ marginBottom: '1.25rem' }}>
              <div className="qc-bill-row">
                <span>Items MRP Total</span>
                <span>₹{(cartTotals.mrp_total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="qc-bill-row savings">
                <span>Product Savings</span>
                <span>-₹{(cartTotals.product_savings || 0).toLocaleString('en-IN')}</span>
              </div>
              {cartTotals.coupon_discount > 0 && (
                <div className="qc-bill-row savings">
                  <span>Coupon Discount</span>
                  <span>-₹{cartTotals.coupon_discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="qc-bill-row">
                <span>Delivery Charge</span>
                <span>{cartTotals.delivery_fee === 0 ? <strong style={{ color: 'var(--qc-green)' }}>FREE</strong> : `₹${cartTotals.delivery_fee}`}</span>
              </div>
              <div className="qc-bill-row total">
                <span>Total Amount to Pay</span>
                <span>₹{(cartTotals.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              className="qc-btn-checkout"
              onClick={onProceedToCheckout}
            >
              <div>
                <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Checkout</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                  ₹{(cartTotals.total || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Proceed</span>
                <ArrowRight size={17} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
