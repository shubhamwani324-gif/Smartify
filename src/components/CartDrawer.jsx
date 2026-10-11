// src/components/CartDrawer.jsx
// SMARTIFY - Quick-Commerce Slide-Out Cart Drawer (Blinkit-inspired UX)
import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Zap,
  Tag,
  AlertCircle,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { resolveProductImage } from '../utils/productImages';

export default function CartDrawer({ onProceedToCheckout, onViewFullCart }) {
  const {
    items,
    itemCount,
    cartTotals,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    couponCode
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (inputCoupon.trim()) {
      applyCoupon(inputCoupon.trim());
    }
  };

  const deliveryThreshold = 499;
  const currentSubtotal = cartTotals.subtotal || 0;
  const freeDeliveryProgress = Math.min(100, Math.round((currentSubtotal / deliveryThreshold) * 100));

  return (
    <div className="qc-drawer-overlay" onClick={closeCart} role="dialog" aria-modal="true">
      <aside className="qc-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="qc-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={20} color="var(--qc-green)" />
            <h2 className="qc-drawer-title">
              My Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <button
            type="button"
            className="qc-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* 10-Minute Delivery ETA Banner */}
        <div className="qc-drawer-eta-banner">
          <Zap size={16} fill="var(--qc-green)" color="var(--qc-green)" />
          <span className="qc-drawer-eta-text">
            ⚡ Delivery in 10-15 mins to your saved address
          </span>
        </div>

        {/* Free Delivery Meter */}
        {itemCount > 0 && (
          <div style={{ padding: '0.75rem 1.25rem 0.25rem 1.25rem' }}>
            <div className="qc-free-delivery-meter">
              <div className="qc-meter-text">
                {cartTotals.is_free_delivery ? (
                  <span style={{ color: 'var(--qc-green)' }}>
                    🎉 Yay! You have unlocked <strong>FREE 10-Min Delivery</strong>!
                  </span>
                ) : (
                  <span>
                    Add <strong>₹{cartTotals.free_delivery_needed || (deliveryThreshold - currentSubtotal)}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                )}
              </div>
              <div className="qc-meter-bar-track">
                <div
                  className="qc-meter-bar-fill"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="qc-drawer-body">
          {itemCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🛒</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
                Your cart is empty!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
                Add smart bulbs, plugs, and cameras to enjoy instant 10-minute delivery.
              </p>
              <button
                type="button"
                className="qc-add-btn"
                onClick={closeCart}
                style={{ padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--qc-green)', color: '#ffffff' }}
              >
                Browse Smart Home
              </button>
            </div>
          ) : (
            <>
              {/* Stock Alerts */}
              {cartTotals.stock_warnings?.length > 0 && (
                <div style={{ padding: '0.65rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#b91c1c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                    <AlertCircle size={14} /> Stock Notice:
                  </div>
                  {cartTotals.stock_warnings.map((w, i) => (
                    <div key={i}>• {w.product_name ? `${w.product_name}: ` : ''}{w.message}</div>
                  ))}
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {items.map((item) => {
                  const itemId = item.product_id || item.id;
                  const imgSrc = resolveProductImage(itemId, item.image_url);

                  return (
                    <div key={itemId} className="qc-drawer-item">
                      <img
                        src={imgSrc || '/products/p-01.jpg'}
                        alt={item.product_name}
                        className="qc-drawer-item-img"
                        onError={(e) => { e.currentTarget.src = '/products/p-01.jpg'; }}
                      />
                      <div className="qc-drawer-item-info">
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--qc-muted)', textTransform: 'uppercase' }}>
                          {item.brand}
                        </div>
                        <div className="qc-drawer-item-title">
                          {item.product_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
                          <span className="qc-drawer-item-price">
                            ₹{Number(item.selling_price).toLocaleString('en-IN')}
                          </span>
                          {item.mrp && item.mrp > item.selling_price && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--qc-muted)', textDecoration: 'line-through' }}>
                              ₹{Number(item.mrp).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="qc-qty-stepper">
                        <button
                          type="button"
                          className="qc-stepper-btn"
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                        </button>
                        <span className="qc-stepper-num">{item.quantity}</span>
                        <button
                          type="button"
                          className="qc-stepper-btn"
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 99)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Coupon Card */}
              <div style={{ backgroundColor: 'var(--qc-bg-page)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--qc-border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--qc-dark)' }}>
                  <Tag size={14} color="var(--qc-green)" /> Apply Coupon Code
                </div>
                {cartTotals.coupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--qc-green-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-green-border)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--qc-green)' }}>
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
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.45rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. SMARTIFY100, WELCOME50"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      style={{ flex: 1, padding: '0.45rem 0.65rem', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', backgroundColor: '#ffffff' }}
                    />
                    <button
                      type="submit"
                      style={{ padding: '0.45rem 0.85rem', backgroundColor: 'var(--qc-dark)', color: '#ffffff', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 800 }}
                    >
                      Apply
                    </button>
                  </form>
                )}
                {cartTotals.coupon_error && (
                  <div style={{ color: 'var(--qc-danger)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    {cartTotals.coupon_error}
                  </div>
                )}
                {/* Instant Coupon Chips */}
                {!cartTotals.coupon && (
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => applyCoupon('SMARTIFY100')}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', background: '#ffffff', border: '1px dashed var(--qc-border)', borderRadius: 'var(--radius-xs)', fontWeight: 700, color: 'var(--qc-dark)' }}
                    >
                      SMARTIFY100 (₹100 Off)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCoupon('WELCOME50')}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', background: '#ffffff', border: '1px dashed var(--qc-border)', borderRadius: 'var(--radius-xs)', fontWeight: 700, color: 'var(--qc-dark)' }}
                    >
                      WELCOME50 (₹50 Off)
                    </button>
                  </div>
                )}
              </div>

              {/* Bill Details Breakdown */}
              <div className="qc-bill-card">
                <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--qc-dark)' }}>
                  Bill Details
                </div>
                <div className="qc-bill-row">
                  <span>Item Total (MRP)</span>
                  <span>₹{(cartTotals.mrp_total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="qc-bill-row savings">
                  <span>Product Discount</span>
                  <span>-₹{(cartTotals.product_savings || 0).toLocaleString('en-IN')}</span>
                </div>
                {cartTotals.coupon_discount > 0 && (
                  <div className="qc-bill-row savings">
                    <span>Coupon Discount</span>
                    <span>-₹{cartTotals.coupon_discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="qc-bill-row">
                  <span>Delivery Partner Fee</span>
                  <span>
                    {cartTotals.delivery_fee === 0 ? (
                      <strong style={{ color: 'var(--qc-green)' }}>FREE</strong>
                    ) : (
                      `₹${cartTotals.delivery_fee}`
                    )}
                  </span>
                </div>
                <div className="qc-bill-row total">
                  <span>To Pay (Grand Total)</span>
                  <span>₹{(cartTotals.total || 0).toLocaleString('en-IN')}</span>
                </div>

                {cartTotals.total_savings > 0 && (
                  <div style={{ marginTop: '0.65rem', padding: '0.45rem', backgroundColor: 'var(--qc-green-light)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--qc-green)', fontWeight: 800 }}>
                    🎉 You saved ₹{cartTotals.total_savings.toLocaleString('en-IN')} on this order!
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Footer Checkout CTA */}
        {itemCount > 0 && (
          <div className="qc-drawer-footer">
            <button
              type="button"
              className="qc-btn-checkout"
              onClick={() => { closeCart(); onProceedToCheckout(); }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 600 }}>Total to Pay</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                  ₹{(cartTotals.total || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <span>Proceed to Pay</span>
                <ArrowRight size={18} />
              </div>
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { closeCart(); onViewFullCart(); }}
                style={{ fontSize: '0.78rem', color: 'var(--qc-muted)', textDecoration: 'underline', fontWeight: 600 }}
              >
                View Full Cart Details
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
