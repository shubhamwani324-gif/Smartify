// src/pages/OrdersPage.jsx
// SMARTIFY - Quick-Commerce My Orders Page
import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { resolveProductImage } from '../utils/productImages';

export default function OrdersPage({ onBackToShopping, onViewOrderDetails }) {
  const { user, openAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="main-content" style={{ maxWidth: '520px', marginTop: '3rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem 1.5rem', boxShadow: 'var(--qc-shadow-sm)' }}>
          <Package size={48} color="var(--qc-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
            Sign in to view your Orders
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
            Log in to track your express deliveries, view receipts, and reorder past smart items.
          </p>
          <button
            type="button"
            className="qc-add-btn"
            style={{ padding: '0.75rem 1.75rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-full)' }}
            onClick={openAuthModal}
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ maxWidth: '960px' }}>
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
        <Package size={24} color="var(--qc-green)" /> My Orders
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--qc-border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem 1.5rem', textAlign: 'center', boxShadow: 'var(--qc-shadow-sm)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📦</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--qc-dark)' }}>
            No Orders Yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
            You haven't placed any SMARTIFY orders yet. Explore our top smart home essentials today.
          </p>
          <button
            type="button"
            className="qc-add-btn"
            style={{ padding: '0.75rem 1.75rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-full)' }}
            onClick={onBackToShopping}
          >
            Shop Smart Home
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const isCaptured = order.payment_status === 'captured';

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--qc-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  boxShadow: 'var(--qc-shadow-sm)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--qc-border-light)', paddingBottom: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--qc-dark)' }}>
                      Order {order.order_number || order.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--qc-muted)' }}>
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isCaptured ? 'var(--qc-green-light)' : 'var(--qc-yellow-light)',
                        color: isCaptured ? 'var(--qc-green)' : 'var(--qc-warning)'
                      }}
                    >
                      {isCaptured ? '✓ Payment Confirmed' : 'Payment Pending'}
                    </span>
                    <button
                      type="button"
                      className="qc-add-btn"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                      onClick={() => onViewOrderDetails && onViewOrderDetails(order.id)}
                    >
                      Track Order
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.85rem' }}>
                  {order.items?.map((item, idx) => {
                    const imgSrc = resolveProductImage(item.product_id, item.image_url);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={imgSrc || '/products/p-01.jpg'}
                          alt={item.product_name}
                          style={{ width: '44px', height: '44px', objectFit: 'contain', padding: '3px', borderRadius: 'var(--radius-sm)', background: 'var(--qc-bg-page)', border: '1px solid var(--qc-border)' }}
                          onError={(e) => { e.currentTarget.src = '/products/p-01.jpg'; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--qc-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.product_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--qc-muted)' }}>
                            Qty: {item.quantity} • ₹{Number(item.price || item.selling_price || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--qc-border)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--qc-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Zap size={13} color="var(--qc-green)" />
                    <span>Delivered to: {order.shipping_address?.city} ({order.shipping_address?.pincode})</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--qc-dark)' }}>
                    Total: ₹{Number(order.total || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
