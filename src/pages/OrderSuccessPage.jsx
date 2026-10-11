// src/pages/OrderSuccessPage.jsx
// SMARTIFY - Quick-Commerce Live Order Tracking & Direct UPI Confirmation Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  Smartphone,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { api } from '../services/api';
import { resolveProductImage } from '../utils/productImages';

export default function OrderSuccessPage({ orderId, onContinueShopping, onViewOrders }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // UTR submission state on tracking page
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState(null);

  const pollingRef = useRef(null);

  const fetchOrderData = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
      return data;
    } catch (err) {
      console.error('Failed to load order data:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchOrderData().finally(() => setLoading(false));

    // Live background polling every 3.5 seconds if payment is pending
    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await api.getPaymentStatus(orderId);
        if (statusRes && statusRes.payment_status === 'captured') {
          // Re-fetch entire confirmed order
          const fullOrder = await api.getOrder(orderId);
          setOrder(fullOrder);
          clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.warn('Polling error on tracking page:', err);
      }
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="main-content" style={{ maxWidth: '680px', textAlign: 'center', padding: '3.5rem 1rem' }}>
        <div className="skeleton" style={{ height: '360px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content" style={{ maxWidth: '580px', textAlign: 'center', padding: '3.5rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Order details not found</h2>
        <p style={{ color: 'var(--qc-muted)', marginBottom: '1.5rem' }}>
          We could not locate this order ID. It may still be syncing or does not exist.
        </p>
        <button
          type="button"
          className="qc-add-btn"
          style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--qc-green)', color: '#ffffff' }}
          onClick={onContinueShopping}
        >
          Return to Store
        </button>
      </div>
    );
  }

  const isPaid = order.payment_status === 'captured';

  // Handle UTR submission directly from tracking screen
  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utrInput.trim()) return;
    setUtrSubmitting(true);
    setUtrSuccessMsg(null);
    try {
      const res = await api.submitUpiReference({
        order_id: order.id,
        utr: utrInput.trim()
      });
      setUtrSuccessMsg('UTR Reference recorded! Payment verification pending. Please wait for confirmation.');
      setOrder(prev => ({ ...prev, upi_utr: utrInput.trim(), payment_status: 'pending_verification', order_status: 'Pending Verification' }));
    } catch (err) {
      alert(err.message || 'Failed to submit UTR reference.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  // Polished order tracking timeline steps
  const steps = [
    {
      title: 'Order Placed',
      desc: `Order ${order.order_number || order.id} created successfully`,
      time: order.created_at ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Confirmed',
      status: 'completed'
    },
    {
      title: 'Payment Confirmed',
      desc: isPaid
        ? `Payment captured securely via Razorpay (Ref: ${order.razorpay_payment_id || order.payment_id || 'Captured'})`
        : 'Payment verification in progress with Razorpay gateway',
      time: isPaid ? 'Captured' : 'Pending',
      status: isPaid ? 'completed' : 'active'
    },
    {
      title: 'Preparing',
      desc: isPaid ? 'Packed at SMARTIFY Local Dark Store • Items verified' : 'Will prepare once payment is verified',
      time: isPaid ? 'In Progress' : 'Queued',
      status: isPaid ? 'active' : 'pending'
    },
    {
      title: 'Out for Delivery',
      desc: 'Local delivery partner assigned with tamper-proof smart box',
      time: 'Next step',
      status: 'pending'
    },
    {
      title: 'Delivered',
      desc: `${order.shipping_address?.house_flat || ''}, ${order.shipping_address?.city || ''}`,
      time: isPaid ? 'Est: ~25-40 mins' : 'Awaiting payment',
      status: 'pending'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-content" style={{ maxWidth: '820px', paddingBottom: '4rem' }}>
      <div className="qc-tracking-card">
        {/* Top Status Header */}
        <div className="qc-tracking-status-hero">
          <div className="qc-tracking-icon-circle" style={{ backgroundColor: isPaid ? 'var(--qc-green-light)' : '#fef3c7', color: isPaid ? 'var(--qc-green)' : '#d97706' }}>
            {isPaid ? <CheckCircle2 size={44} /> : <Clock size={44} />}
          </div>

          {/* Status Headers */}
          {isPaid ? (
            <>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--qc-dark)', marginBottom: '0.35rem' }}>
                Payment Received Successfully!
              </h1>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--qc-green)', margin: '0 auto 0.75rem auto' }}>
                Your order has been confirmed.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#b45309', marginBottom: '0.35rem' }}>
                Payment verification pending. Please wait for confirmation.
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--qc-muted)', maxWidth: '540px', margin: '0 auto 0.75rem auto' }}>
                We have registered your order <strong>{order.order_number}</strong>. Waiting for payment confirmation from Razorpay gateway for <strong>₹{order.total}</strong>.
              </p>
            </>
          )}

          {/* Realistic ETA Label */}
          <div className="qc-tracking-eta-pill">
            <Zap size={16} fill="var(--qc-dark)" />
            <span>
              {isPaid
                ? '⚡ Demo Prototype: Estimated Delivery in ~25–40 mins to ' + (order.shipping_address?.pincode || '')
                : '⚡ Delivery partner will be dispatched once payment is confirmed'}
            </span>
          </div>
        </div>

        {/* Live Delivery Progress Stepper */}
        <div style={{ padding: '1.75rem 0', borderBottom: '1px solid var(--qc-border-light)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--qc-dark)', marginBottom: '1.25rem' }}>
            Live Fulfillment Status
          </div>

          <div className="qc-stepper-track">
            {steps.map((step, idx) => (
              <div key={idx} className="qc-step-row">
                <div className={`qc-step-dot ${step.status}`}>
                  {step.status === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="qc-step-info">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div className="qc-step-title">{step.title}</div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: step.status === 'active' ? (isPaid ? 'var(--qc-green)' : '#b45309') : 'var(--qc-muted)' }}>
                      {step.time}
                    </span>
                  </div>
                  <div className="qc-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: isPaid ? 'var(--qc-green-light)' : '#fffbeb', borderRadius: 'var(--radius-sm)', border: `1px solid ${isPaid ? 'var(--qc-green-border)' : '#fde68a'}`, fontSize: '0.78rem', color: isPaid ? 'var(--qc-green)' : '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={15} />
            <span>
              {isPaid
                ? 'Delivery partner assigned directly from nearest SMARTIFY Express Hub. All devices verified authentic.'
                : 'Direct UPI payments require verification against bank records. Please do not submit duplicate payments.'}
            </span>
          </div>
        </div>

        {/* Ordered Items Summary */}
        <div style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--qc-border-light)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--qc-dark)', marginBottom: '1rem' }}>
            Ordered Items ({order.items?.length || 0})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(order.items || []).map((item, idx) => {
              const imgSrc = resolveProductImage(item.product_id || item.id, item.image_url);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={imgSrc || '/products/p-01.jpg'}
                    alt={item.product_name}
                    style={{ width: '48px', height: '48px', objectFit: 'contain', background: 'var(--qc-bg-page)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', padding: '4px' }}
                    onError={(e) => { e.currentTarget.src = '/products/p-01.jpg'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--qc-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--qc-muted)' }}>
                      Qty: {item.quantity} × ₹{Number(item.price || item.selling_price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem' }}>
                    ₹{Number((item.price || item.selling_price || 0) * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address & Payment Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem 0', borderBottom: '1px solid var(--qc-border-light)' }}>
          {/* Address */}
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--qc-dark)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} color="var(--qc-green)" /> Delivery Address
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--qc-dark-secondary)', lineHeight: 1.4 }}>
              <strong>{order.shipping_address?.full_name}</strong><br />
              {order.shipping_address?.house_flat}, {order.shipping_address?.street_area}<br />
              {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}<br />
              Phone: {order.shipping_address?.phone}
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--qc-dark)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={15} color="var(--qc-green)" /> Payment Details
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--qc-dark-secondary)', lineHeight: 1.4 }}>
              Method: <strong>Direct UPI (8468990113@ibl)</strong><br />
              Status: <strong style={{ color: isPaid ? 'var(--qc-green)' : '#d97706' }}>
                {isPaid ? 'PAID (Captured & Verified)' : 'PENDING (Verification in Progress)'}
              </strong><br />
              Total Amount: <strong style={{ fontSize: '0.95rem' }}>₹{Number(order.total || 0).toLocaleString('en-IN')}</strong><br />
              {order.upi_utr && (
                <>Submitted UTR: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.upi_utr}</span><br /></>
              )}
              {order.verified_by && (
                <>Verified By: <span style={{ color: 'var(--qc-green)', fontWeight: 700 }}>{order.verified_by}</span><br /></>
              )}
              {order.verified_at && (
                <>Verified At: <span>{new Date(order.verified_at).toLocaleTimeString('en-IN')}</span></>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              className="qc-add-btn"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem' }}
            >
              <Printer size={15} /> Print / Save Tax Invoice
            </button>
            <button
              type="button"
              className="qc-add-btn"
              onClick={onViewOrders}
              style={{ padding: '0.6rem 1rem' }}
            >
              View My Orders
            </button>
          </div>

          <button
            type="button"
            className="qc-btn-checkout"
            onClick={onContinueShopping}
            style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
          >
            <span>Continue Shopping</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
