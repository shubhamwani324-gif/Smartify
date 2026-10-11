// src/components/Navbar.jsx
// SMARTIFY - Quick-Commerce Sticky Navigation Bar (Blinkit-inspired UX)
import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  User,
  Package,
  Heart,
  LogOut,
  X,
  Zap,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { resolveProductImage } from '../utils/productImages';

export default function Navbar({ onOpenAdmin, onViewOrders, onViewWishlist, onSelectProduct }) {
  const { user, isAdmin, logout, openAuthModal } = useAuth();
  const { items, itemCount, cartTotals, openCart, addToCart, updateQuantity, getItemQuantity } = useCart();
  const { wishlistCount } = useWishlist();
  const { pincodeData, selectedAddress, openAddressModal } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Search Suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.getProducts({ search: searchQuery.trim(), limit: 6 });
        setSuggestions(res.products || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (product) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (onSelectProduct) onSelectProduct(product);
  };

  const deliveryCity = selectedAddress?.city || (pincodeData?.city ? pincodeData.city.split(',')[0].trim() : 'Express Hub');
  const deliveryPincode = selectedAddress?.pincode || pincodeData?.pincode || '110001';

  return (
    <header className="qc-navbar">
      <div className="qc-navbar-inner">
        {/* Brand Logo with Lightning Quick-Commerce Badge */}
        <a href="/" className="qc-brand" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}>
          <div className="qc-brand-badge" title="SMARTIFY Smart Home">
            ⚡
          </div>
          <div className="qc-brand-text">
            <span className="qc-brand-title">SMARTIFY</span>
            <span className="qc-brand-tagline">Smart Living. Simple Prices.</span>
          </div>
        </a>

        {/* Delivery Location & Address Selector */}
        <button
          type="button"
          className="qc-location-pill"
          onClick={openAddressModal}
          title="Change delivery location / address"
        >
          <div className="qc-location-icon">
            <MapPin size={18} />
          </div>
          <div className="qc-location-text">
            <div className="qc-location-eta">
              {selectedAddress ? `${selectedAddress.tag || 'Home'} Delivery` : 'Deliver to'}
            </div>
            <div className="qc-location-address">
              {selectedAddress
                ? `${selectedAddress.house_flat ? selectedAddress.house_flat.slice(0, 16) + '..., ' : ''}${selectedAddress.pincode}`
                : `${deliveryCity} (${deliveryPincode})`} ▾
            </div>
          </div>
        </button>

        {/* Search Bar with Instant Dropdown */}
        <div className="qc-search-wrapper" ref={searchRef}>
          <div className="qc-search-box">
            <Search size={18} color="var(--qc-light-muted)" />
            <input
              type="text"
              className="qc-search-input"
              placeholder='Search "smart bulb", "wifi plug", "security camera", "sensor"...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                style={{ color: 'var(--qc-muted)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Real-time Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="qc-search-dropdown">
              <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--qc-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Instant Smart Devices ({suggestions.length})
              </div>
              {suggestions.map((product) => {
                const qty = getItemQuantity(product.id);
                const discount = product.discount_percentage || (product.mrp && product.selling_price && product.mrp > product.selling_price ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100) : 0);
                const imgSrc = resolveProductImage(product.id, product.image_url);

                return (
                  <div
                    key={product.id}
                    className="qc-search-item"
                    onClick={() => handleSelectSuggestion(product)}
                  >
                    <img
                      src={imgSrc || '/products/p-01.jpg'}
                      alt={product.product_name}
                      className="qc-search-item-img"
                      onError={(e) => { e.currentTarget.src = '/products/p-01.jpg'; }}
                    />
                    <div className="qc-search-item-info">
                      <div className="qc-search-item-title">{product.product_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="qc-search-item-price">₹{Number(product.selling_price).toLocaleString('en-IN')}</span>
                        {product.mrp && product.mrp > product.selling_price && (
                          <span className="qc-search-item-mrp">₹{Number(product.mrp).toLocaleString('en-IN')}</span>
                        )}
                        {discount > 0 && (
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--qc-green)' }}>
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Instant Add or Stepper inside Dropdown */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {product.stock <= 0 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--qc-muted)', fontWeight: 600 }}>OUT</span>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          className="qc-add-btn"
                          style={{ padding: '0.25rem 0.65rem', minWidth: '56px', fontSize: '0.78rem' }}
                          onClick={() => addToCart(product, 1)}
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="qc-qty-stepper" style={{ borderRadius: 'var(--radius-xs)' }}>
                          <button
                            type="button"
                            className="qc-stepper-btn"
                            style={{ padding: '0.2rem 0.4rem' }}
                            onClick={() => updateQuantity(product.id, qty - 1)}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="qc-stepper-num" style={{ fontSize: '0.78rem', minWidth: '18px' }}>{qty}</span>
                          <button
                            type="button"
                            className="qc-stepper-btn"
                            style={{ padding: '0.2rem 0.4rem' }}
                            onClick={() => updateQuantity(product.id, qty + 1)}
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Navigation Controls */}
        <div className="qc-nav-actions">
          {/* Track Orders Link */}
          <button
            type="button"
            className="qc-nav-btn"
            onClick={onViewOrders}
            title="Track my SMARTIFY orders"
          >
            <Package size={17} color="var(--qc-dark-secondary)" />
            <span style={{ display: 'none', minWidth: '60px' }} className="d-md-inline">Orders</span>
          </button>

          {/* Wishlist Link */}
          <button
            type="button"
            className="qc-nav-btn"
            onClick={onViewWishlist}
            title="Saved wishlist items"
            style={{ position: 'relative' }}
          >
            <Heart size={17} color="var(--qc-dark-secondary)" />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                  backgroundColor: 'var(--qc-danger)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            {user ? (
              <button
                type="button"
                className="qc-nav-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ backgroundColor: 'var(--qc-bg-page)' }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--qc-yellow)',
                    color: 'var(--qc-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}
                >
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name ? user.full_name.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="qc-nav-btn"
                onClick={openAuthModal}
              >
                <User size={17} />
                <span>Login</span>
              </button>
            )}

            {/* User Dropdown Menu */}
            {showUserMenu && user && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--qc-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--qc-shadow-hover)',
                  width: '200px',
                  zIndex: 200,
                  padding: '0.4rem 0'
                }}
              >
                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--qc-border-light)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--qc-dark)' }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--qc-muted)' }}>{user.phone || user.email}</div>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); onViewOrders(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--qc-dark)' }}
                >
                  <Package size={15} /> My Orders
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onOpenAdmin(); }}
                    style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 600 }}
                  >
                    <ShieldCheck size={15} /> Admin Dashboard
                  </button>
                )}

                <div style={{ borderTop: '1px solid var(--qc-border-light)', margin: '0.3rem 0' }} />

                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--qc-danger)' }}
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Signature Quick-Commerce Cart Button with Item Count & Live Total */}
          <button
            type="button"
            className="qc-cart-pill"
            onClick={openCart}
            title="Open Shopping Cart"
          >
            <div className="qc-cart-badge">
              <ShoppingCart size={18} />
              <span className="qc-cart-badge-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            {itemCount > 0 && (
              <>
                <div className="qc-cart-divider" />
                <div className="qc-cart-total">
                  ₹{Number(cartTotals.total || 0).toLocaleString('en-IN')}
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
