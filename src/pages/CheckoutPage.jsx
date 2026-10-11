// src/pages/CheckoutPage.jsx
// SMARTIFY - Indian Smart Home Marketplace
// Simplified, Mobile-Friendly Razorpay Standard Checkout with Automatic Payment Confirmation
import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  MapPin,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Lock,
  CreditCard,
  Building,
  Smartphone,
  Info,
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { resolveProductImage } from '../utils/productImages';

export default function CheckoutPage({ onBackToCart, onOrderSuccess }) {
  const { items, cartTotals, clearCart } = useCart();
  const { user } = useAuth();
  const { pincodeData } = useLocation();

  // Payment configuration from server (public keys only)
  const [paymentConfig, setPaymentConfig] = useState({
    razorpay_key_id: '',
    merchant_name: 'SMARTIFY'
  });

  // Customer form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Address form state
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [city, setCity] = useState(pincodeData?.city?.split(',')[0] || 'New Delhi');
  const [state, setState] = useState(pincodeData?.state || 'Delhi');
  const [pincode, setPincode] = useState(pincodeData?.pincode || '110001');

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Payment processing states
  // status: 'idle' | 'initiating' | 'processing' | 'verifying' | 'polling' | 'failed'
  const [paymentState, setPaymentState] = useState({
    status: 'idle',
    message: ''
  });
  const [errorMessage, setErrorMessage] = useState(null);

  const pollingIntervalRef = useRef(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch payment config on mount
  useEffect(() => {
    let mounted = true;
    api.getPaymentConfig()
      .then((cfg) => {
        if (mounted && cfg) {
          setPaymentConfig(cfg);
        }
      })
      .catch((err) => console.warn('Could not load payment configuration:', err));
    return () => { mounted = false; };
  }, []);

  // Load saved addresses if user is logged in
  useEffect(() => {
    async function loadSavedAddresses() {
      if (!user) return;
      try {
        const list = await api.getAddresses();
        setSavedAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          setSelectedAddressId(defaultAddr.id);
          applySavedAddress(defaultAddr);
        }
      } catch (err) {
        console.warn('Could not load saved addresses');
      }
    }
    loadSavedAddresses();
  }, [user]);

  const applySavedAddress = (addr) => {
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setHouseFlat(addr.house_flat);
    setStreetArea(addr.street_area);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
  };

  const handleSelectSaved = (addr) => {
    setSelectedAddressId(addr.id);
    applySavedAddress(addr);
  };

  const validateInputs = () => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (!phone.trim() || !/^[6-9][0-9]{9}$/.test(phone.trim())) return 'Please enter a valid 10-digit Indian mobile number.';
    if (!houseFlat.trim()) return 'Please enter House/Flat/Building details.';
    if (!streetArea.trim()) return 'Please enter Street/Area/Locality.';
    if (!city.trim()) return 'Please enter City.';
    if (!state.trim()) return 'Please enter State.';
    if (!pincode.trim() || !/^[1-9][0-9]{5}$/.test(pincode.trim())) return 'Please enter a valid 6-digit Indian PIN code.';
    return null;
  };

  // Helper to dynamically load official Razorpay Checkout SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && typeof window.Razorpay === 'function') {
        return resolve(true);
      }
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Polling fallback if confirmation is delayed
  const pollOrderStatus = (orderId, maxAttempts = 6) => {
    setPaymentState({
      status: 'polling',
      message: 'Payment processing... Rechecking status with your bank...'
    });

    let attempts = 0;
    pollingIntervalRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const statusRes = await api.getPaymentStatus(orderId);
        if (statusRes && (statusRes.payment_status === 'captured' || statusRes.is_paid)) {
          clearInterval(pollingIntervalRef.current);
          setPaymentState({ status: 'idle', message: '' });
          clearCart();
          onOrderSuccess(orderId);
          return;
        }
      } catch (pollErr) {
        console.warn('Poll error:', pollErr);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollingIntervalRef.current);
        setPaymentState({ status: 'idle', message: '' });
        setErrorMessage(
          'Your payment is currently being confirmed by your bank/UPI app. Your cart is preserved, and your order will automatically be updated in My Orders once cleared.'
        );
      }
    }, 2500);
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (paymentState.status !== 'idle') return;

    setErrorMessage(null);

    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setPaymentState({
      status: 'initiating',
      message: 'Connecting securely to Razorpay...'
    });

    try {
      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.product_id || i.id,
          product_name: i.product_name,
          quantity: i.quantity
        })),
        customer_details: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim()
        },
        shipping_address: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          house_flat: houseFlat.trim(),
          street_area: streetArea.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim()
        },
        coupon_code: cartTotals.coupon?.code || null
      };

      // Save address if user is logged in
      if (user && !selectedAddressId) {
        api.addAddress({
          full_name: fullName.trim(),
          phone: phone.trim(),
          house_flat: houseFlat.trim(),
          street_area: streetArea.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          is_default: true
        }).catch(() => {});
      }

      // Step 1: Create server-calculated order on Flask backend
      const res = await api.createPaymentOrder(orderPayload);

      // Step 2: Load official Razorpay Checkout SDK
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window.Razorpay !== 'function') {
        throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
      }

      // Step 3: Configure Razorpay Standard Checkout
      const options = {
        key: res.key_id || paymentConfig.razorpay_key_id,
        amount: res.amount,
        currency: res.currency || 'INR',
        name: 'SMARTIFY',
        description: `Order ${res.order_number}`,
        order_id: res.razorpay_order_id,
        prefill: {
          name: fullName.trim(),
          email: email.trim(),
          contact: phone.trim()
        },
        theme: {
          color: '#059669' // SMARTIFY Emerald
        },
        // Official Razorpay Standard Checkout display blocks
        // Prioritizes UPI (Google Pay, PhonePe, Paytm, BHIM, QR) while keeping Cards, NetBanking, Wallets
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / QR (Google Pay, PhonePe, Paytm)',
                instruments: [
                  { method: 'upi' }
                ]
              },
              other: {
                name: 'Debit/Credit Cards, NetBanking & Wallets',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        notes: {
          platform: 'SMARTIFY Smart Home',
          order_id: res.order_id,
          order_number: res.order_number
        },
        handler: async function (response) {
          // Automatic Payment Confirmation
          try {
            setPaymentState({
              status: 'verifying',
              message: 'Payment completed! Verifying cryptographic signature and payment status...'
            });

            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: res.order_id
            });

            if (verifyRes.success) {
              setPaymentState({ status: 'idle', message: '' });
              clearCart();
              onOrderSuccess(res.order_id);
            } else {
              // If delayed, retry verification in background
              pollOrderStatus(res.order_id);
            }
          } catch (err) {
            console.warn('Immediate verification error, checking background status:', err.message);
            pollOrderStatus(res.order_id);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentState({ status: 'idle', message: '' });
            setErrorMessage('Payment window was closed. Your cart has been preserved so you can retry anytime.');
            api.reportPaymentFailed({
              order_id: res.order_id,
              error_code: 'CANCELLED_BY_USER',
              error_description: 'Customer dismissed Razorpay window'
            }).catch(() => {});
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentState({ status: 'idle', message: '' });
        setErrorMessage(`Payment complete nahi hua: ${resp.error?.description || 'Transaction was declined.'}. Your cart is preserved.`);
        api.reportPaymentFailed({
          order_id: res.order_id,
          error_code: resp.error?.code,
          error_description: resp.error?.description
        }).catch(() => {});
      });

      setPaymentState({ status: 'processing', message: 'Waiting for payment completion in Razorpay...' });
      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      setPaymentState({ status: 'idle', message: '' });
      setErrorMessage(err.message || 'Payment could not be started. Please try again.');
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1040px', paddingBottom: '4rem' }}>
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={onBackToCart}
          disabled={paymentState.status !== 'idle'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-charcoal-700)',
            cursor: paymentState.status !== 'idle' ? 'not-allowed' : 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={18} />
          Back to Cart
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
          <ShieldCheck size={18} />
          100% Secure 256-Bit Encrypted Razorpay Checkout
        </div>
      </div>

      {/* Global Error Alert */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>{errorMessage}</div>
        </div>
      )}

      {/* Processing Payment Overlay */}
      {paymentState.status !== 'idle' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <RefreshCw size={32} className="spin-slow" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-charcoal-900)', marginBottom: '0.5rem' }}>
              Processing Payment...
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-charcoal-600)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {paymentState.message || 'Please do not refresh or close this window.'}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              Verifying automatically with server
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleProceedToPayment}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          {/* LEFT COLUMN: Customer & Delivery Address */}
          <div>
            {/* Saved Addresses Selector (if logged in) */}
            {savedAddresses.length > 0 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-charcoal-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-charcoal-900)' }}>
                    Saved Delivery Addresses
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: selectedAddressId === addr.id ? '2px solid #059669' : '1px solid var(--color-charcoal-200)',
                        backgroundColor: selectedAddressId === addr.id ? '#ecfdf5' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="saved_address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => handleSelectSaved(addr)}
                        style={{ marginTop: '3px' }}
                      />
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-charcoal-900)' }}>{addr.full_name} ({addr.phone})</div>
                        <div style={{ color: 'var(--color-charcoal-600)' }}>
                          {addr.house_flat}, {addr.street_area}, {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Address Details Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-charcoal-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-charcoal-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} color="#059669" />
                Delivery Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid var(--color-charcoal-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-charcoal-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-charcoal-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                    House / Flat / Floor / Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Flat 402, Sunshine Heights"
                    value={houseFlat}
                    onChange={(e) => setHouseFlat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid var(--color-charcoal-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                    Street / Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sector 14, Main Market Road"
                    value={streetArea}
                    onChange={(e) => setStreetArea(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid var(--color-charcoal-300)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-charcoal-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-charcoal-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-700)', marginBottom: '0.35rem' }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--color-charcoal-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Razorpay Primary Action */}
          <div>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-charcoal-200)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                position: 'sticky',
                top: '5rem'
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-charcoal-900)', marginBottom: '1.25rem' }}>
                Order Summary ({items.length} items)
              </h2>

              {/* Items List Mini */}
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  borderBottom: '1px solid var(--color-charcoal-200)',
                  paddingBottom: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {items.map((it) => (
                  <div key={it.product_id || it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        border: '1px solid var(--color-charcoal-200)'
                      }}
                    >
                      <img
                        src={resolveProductImage(it.image_url, it.product_name)}
                        alt={it.product_name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.src = '/products/fallback-smart-device.png'; }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-charcoal-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {it.product_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-500)' }}>
                        Qty: {it.quantity} × ₹{it.selling_price?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-charcoal-900)' }}>
                      ₹{(it.selling_price * it.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-charcoal-600)' }}>
                  <span>Items MRP Total</span>
                  <span style={{ textDecoration: 'line-through' }}>₹{cartTotals.mrp_total?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-charcoal-600)' }}>
                  <span>Selling Subtotal</span>
                  <span>₹{cartTotals.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                  <span>Instant Product Savings</span>
                  <span>-₹{(cartTotals.mrp_total - cartTotals.subtotal)?.toLocaleString('en-IN')}</span>
                </div>
                {cartTotals.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                    <span>Coupon Discount ({cartTotals.coupon?.code})</span>
                    <span>-₹{cartTotals.discount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-charcoal-600)' }}>
                  <span>Delivery Charges</span>
                  <span>
                    {cartTotals.delivery_fee === 0 ? (
                      <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                    ) : (
                      `₹${cartTotals.delivery_fee}`
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: '0.75rem',
                    borderTop: '2px dashed var(--color-charcoal-200)',
                    marginTop: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-charcoal-900)' }}>
                    Total Amount
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669' }}>
                    ₹{cartTotals.total?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Supported Payment Badges */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--color-charcoal-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-charcoal-700)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Supported Payment Options:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                    ⚡ UPI (GPay, PhonePe, Paytm, QR)
                  </span>
                  <span style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                    💳 Credit / Debit Cards
                  </span>
                  <span style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                    🏦 NetBanking
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Automatic payment confirmation via Razorpay. No manual screenshot or UPI ID input needed.
                </div>
              </div>

              {/* PRIMARY ACTION BUTTON */}
              <button
                type="submit"
                disabled={paymentState.status !== 'idle' || items.length === 0}
                style={{
                  width: '100%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.95rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: paymentState.status !== 'idle' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Lock size={18} />
                Proceed to Payment • ₹{cartTotals.total?.toLocaleString('en-IN')}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  marginTop: '0.85rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-charcoal-500)'
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>Protected by Razorpay Standard Checkout & 256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
