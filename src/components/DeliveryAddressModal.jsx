// src/components/DeliveryAddressModal.jsx
// SMARTIFY - Delivery Address Management & Geolocation Modal
import React, { useState } from 'react';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Navigation,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function DeliveryAddressModal() {
  const {
    isAddressModalOpen,
    closeAddressModal,
    savedAddresses,
    selectedAddress,
    selectAddress,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    verifyAndSetPincode
  } = useLocation();

  const { user, openAuthModal } = useAuth();

  // Mode: 'list' (select address), 'form' (add or edit address), 'pincode' (quick PIN check)
  const [mode, setMode] = useState('list');
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [tag, setTag] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Quick pincode entry state
  const [quickPin, setQuickPin] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isAddressModalOpen) return null;

  const resetForm = () => {
    setTag('Home');
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    setHouseFlat('');
    setStreetArea('');
    setLocality('');
    setCity('');
    setState('');
    setPincode('');
    setDeliveryInstructions('');
    setIsDefault(false);
    setEditingId(null);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleStartAdd = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    resetForm();
    setMode('form');
  };

  const handleStartEdit = (addr, e) => {
    e.stopPropagation();
    setEditingId(addr.id);
    setTag(addr.tag || 'Home');
    setFullName(addr.full_name || '');
    setPhone(addr.phone || '');
    setHouseFlat(addr.house_flat || '');
    setStreetArea(addr.street_area || '');
    setLocality(addr.locality || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setDeliveryInstructions(addr.delivery_instructions || '');
    setIsDefault(!!addr.is_default);
    setErrorMsg('');
    setInfoMsg('');
    setMode('form');
  };

  // Browser Geolocation: REQUESTED ONLY AFTER USER CLICKS THIS BUTTON
  const handleUseCurrentLocation = () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please enter your address details manually.');
      return;
    }

    setLocating(true);
    setInfoMsg('Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setInfoMsg('Resolving nearby locality and postal PIN code...');
          const geoRes = await api.reverseGeocode(latitude, longitude);

          if (geoRes) {
            if (geoRes.pincode) setPincode(geoRes.pincode);
            if (geoRes.city) setCity(geoRes.city);
            if (geoRes.state) setState(geoRes.state);
            if (geoRes.locality) setLocality(geoRes.locality);
            if (geoRes.street) setStreetArea(geoRes.street);
            setInfoMsg('Location detected! Please review and fill your flat/house number.');
          }
        } catch (err) {
          setErrorMsg('Could not detect address automatically. Please enter your address manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setInfoMsg('');
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. Please enter your PIN code and address manually below.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg('Location signal unavailable. Please enter your PIN code manually.');
        } else {
          setErrorMsg('Location request timed out. Please enter your PIN code manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    // Field Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter a valid recipient full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone[0])) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!houseFlat.trim()) {
      setErrorMsg('Please enter house/flat/building details.');
      return;
    }

    const cleanPin = pincode.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin) || cleanPin[0] === '0') {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);

    const payload = {
      tag,
      full_name: fullName.trim(),
      phone: cleanPhone,
      house_flat: houseFlat.trim(),
      street_area: streetArea.trim(),
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: cleanPin,
      delivery_instructions: deliveryInstructions.trim(),
      is_default: isDefault
    };

    let res;
    if (editingId) {
      res = await updateAddress(editingId, payload);
    } else {
      res = await addAddress(payload);
    }

    setLoading(false);

    if (res.success) {
      setMode('list');
      resetForm();
    } else {
      setErrorMsg(res.error || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this delivery address?')) {
      await deleteAddress(id);
    }
  };

  const handleQuickPinSubmit = async (e) => {
    e.preventDefault();
    if (quickPin.length !== 6 || !/^\d{6}$/.test(quickPin)) {
      setErrorMsg('Please enter a valid 6-digit PIN code.');
      return;
    }
    setLoading(true);
    const res = await verifyAndSetPincode(quickPin);
    setLoading(false);
    if (res.success) {
      closeAddressModal();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={closeAddressModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--qc-shadow-drawer)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.15rem 1.4rem',
            borderBottom: '1px solid var(--qc-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MapPin size={22} color="var(--qc-green)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--qc-dark)', margin: 0 }}>
                {mode === 'form' ? (editingId ? 'Edit Delivery Address' : 'Add New Address') : 'Delivery Address'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--qc-muted)' }}>
                {mode === 'form' ? 'Delivery details will be saved to your profile' : 'Select delivery location for express dispatch'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAddressModal}
            style={{ background: 'none', border: 'none', color: 'var(--qc-muted)', cursor: 'pointer', padding: '0.3rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: '#15803d',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* MODE: LIST OF ADDRESSES */}
          {mode === 'list' && (
            <div>
              {/* Quick Actions Bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="qc-add-btn"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--qc-green)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.88rem'
                  }}
                >
                  <Plus size={16} /> Add New Address
                </button>

                <button
                  type="button"
                  onClick={() => { resetForm(); setMode('pincode'); }}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--qc-border)',
                    backgroundColor: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: 'var(--qc-dark)',
                    cursor: 'pointer'
                  }}
                >
                  Quick PIN
                </button>
              </div>

              {!user && (
                <div
                  style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    border: '1px dashed var(--qc-border)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ fontSize: '0.85rem', color: 'var(--qc-dark)', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Sign in to view your saved addresses
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--qc-muted)', marginBottom: '0.75rem' }}>
                    Save Home and Work addresses for instant 1-click checkout.
                  </p>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: '#111827',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              {/* Saved Addresses List */}
              {savedAddresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    const tagClass =
                      addr.tag === 'Home'
                        ? 'qc-addr-tag-home'
                        : addr.tag === 'Work'
                        ? 'qc-addr-tag-work'
                        : 'qc-addr-tag-other';

                    return (
                      <div
                        key={addr.id}
                        className={`qc-addr-card ${isSelected ? 'qc-addr-card-selected' : ''}`}
                        onClick={() => {
                          selectAddress(addr);
                          closeAddressModal();
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={`qc-addr-tag-pill ${tagClass}`}>
                              {addr.tag === 'Work' ? <Briefcase size={12} /> : <Home size={12} />}
                              {addr.tag || 'Home'}
                            </span>
                            {addr.is_default && (
                              <span className="qc-addr-default-badge">DEFAULT</span>
                            )}
                            {isSelected && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--qc-green)', fontSize: '0.75rem', fontWeight: 700 }}>
                                <Check size={14} /> Active
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={(e) => handleStartEdit(addr, e)}
                              style={{ background: 'none', border: 'none', color: 'var(--qc-muted)', cursor: 'pointer', padding: '0.25rem' }}
                              title="Edit address"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }}
                              title="Delete address"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--qc-dark)', marginBottom: '0.2rem' }}>
                          {addr.full_name} &bull; <span style={{ fontWeight: 500, color: 'var(--qc-muted)' }}>+91 {addr.phone}</span>
                        </div>

                        <div style={{ fontSize: '0.84rem', color: 'var(--qc-dark-secondary)', lineHeight: 1.4 }}>
                          {addr.house_flat}{addr.street_area ? `, ${addr.street_area}` : ''}{addr.locality ? `, ${addr.locality}` : ''}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--qc-muted)' }}>
                          {addr.city ? `${addr.city}, ` : ''}{addr.state ? `${addr.state} - ` : ''}<strong>PIN {addr.pincode}</strong>
                        </div>

                        {addr.delivery_instructions && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Instruction: "{addr.delivery_instructions}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                user && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--qc-muted)' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>No saved delivery addresses yet.</p>
                    <p style={{ fontSize: '0.8rem' }}>Click <strong>+ Add New Address</strong> to save your address for rapid deliveries.</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* MODE: ADD OR EDIT ADDRESS FORM */}
          {mode === 'form' && (
            <form onSubmit={handleFormSubmit}>
              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: '1.5px dashed var(--qc-green)',
                  backgroundColor: 'var(--qc-green-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--qc-green-hover)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: locating ? 'wait' : 'pointer',
                  marginBottom: '1.25rem'
                }}
              >
                {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                {locating ? 'Detecting Location...' : 'Use My Current Location (GPS)'}
              </button>

              {/* Address Tag Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--qc-dark)', marginBottom: '0.35rem' }}>
                  Address Type (टैग)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: tag === t ? '2px solid var(--qc-green)' : '1px solid var(--qc-border)',
                        background: tag === t ? 'var(--qc-green-light)' : '#ffffff',
                        color: tag === t ? 'var(--qc-green)' : 'var(--qc-dark)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name and Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaurav Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    10-Digit Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Flat / Building */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                  Flat, House No., Building Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B, Flat 402, Green Palms Society"
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Street & Locality */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    Street / Road
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Linking Road"
                    value={streetArea}
                    onChange={(e) => setStreetArea(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    Locality / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bandra West"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* PIN Code, City, State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="110001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--qc-dark)', marginBottom: '0.25rem' }}>
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell, leave with security guard, call before arriving"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Default Address Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="set-default-check"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--qc-green)' }}
                />
                <label htmlFor="set-default-check" style={{ fontSize: '0.85rem', color: 'var(--qc-dark)', cursor: 'pointer' }}>
                  Set as default delivery address
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => { setMode('list'); resetForm(); }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--qc-border)',
                    backgroundColor: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="qc-add-btn"
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--qc-green)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem'
                  }}
                >
                  {loading ? 'Saving...' : (editingId ? 'Update Address' : 'Save & Select Address')}
                </button>
              </div>
            </form>
          )}

          {/* MODE: QUICK PINCODE ENTRY */}
          {mode === 'pincode' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--qc-muted)', marginBottom: '1rem' }}>
                Enter your 6-digit Indian PIN code to view delivery coverage for your location.
              </p>
              <form onSubmit={handleQuickPinSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  value={quickPin}
                  onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ''))}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--qc-border)', fontSize: '0.9rem', fontWeight: 700 }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="qc-add-btn"
                  style={{ padding: '0.75rem 1.25rem', backgroundColor: 'var(--qc-green)', color: '#ffffff', borderRadius: 'var(--radius-sm)' }}
                >
                  {loading ? 'Checking...' : 'Apply'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setMode('list')}
                style={{ background: 'none', border: 'none', color: 'var(--qc-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                &larr; Back to saved addresses
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
