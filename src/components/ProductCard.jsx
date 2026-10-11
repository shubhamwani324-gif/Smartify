// src/components/ProductCard.jsx
// SMARTIFY - Compact Quick-Commerce Product Card (Blinkit-Inspired UX)
import React from 'react';
import { Heart, Plus, Minus, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductImage from './ProductImage';

export default function ProductCard({ product, onSelect, eager = false }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!product) return null;

  const qty = getItemQuantity(product.id);
  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = product.stock <= 0;

  // Calculate discount percentage
  const discount = product.discount_percentage !== undefined
    ? product.discount_percentage
    : (product.mrp && product.selling_price && product.mrp > product.selling_price)
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
      : 0;

  const handleCardClick = () => {
    if (onSelect) onSelect(product);
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (qty < product.stock) {
      updateQuantity(product.id, qty + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, qty - 1);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Extract a concise key specification / pack size if available
  const specText = product.model || product.key_feature || (product.category_slug ? product.category_slug.replace('-', ' ') : 'Smart Device');

  return (
    <article
      className="qc-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${product.product_name} by ${product.brand}, ₹${product.selling_price}`}
      onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
    >
      {/* Top Badges Bar: 10-MIN Delivery ETA & Discount Badge */}
      <div className="qc-card-top-tags">
        <span className="qc-delivery-tag">
          ⚡ 10 MINS
        </span>

        {discount > 0 && (
          <span className="qc-discount-tag">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlistClick}
          style={{
            marginLeft: discount > 0 ? '0.35rem' : 'auto',
            color: wishlisted ? 'var(--qc-danger)' : 'var(--qc-light-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px'
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            fill={wishlisted ? 'var(--qc-danger)' : 'none'}
            color={wishlisted ? 'var(--qc-danger)' : 'currentColor'}
          />
        </button>
      </div>

      {/* Product Image Media Container */}
      <div className="qc-card-media">
        <ProductImage
          productId={product.id}
          src={product.image_url}
          alt={product.product_name}
          categorySlug={product.category_slug}
          fit="contain"
          aspectRatio="1 / 1"
          eager={eager}
        />
      </div>

      {/* Product Info Body */}
      <div className="qc-card-body">
        <div className="qc-card-brand">
          {product.brand}
        </div>

        <h3 className="qc-card-title" title={product.product_name}>
          {product.product_name}
        </h3>

        <div className="qc-card-spec" title={specText}>
          {specText}
        </div>

        {/* Bottom Bar: Price and Signature Quick-Commerce ADD Button */}
        <div className="qc-card-bottom">
          <div className="qc-card-price-wrap">
            <div className="qc-card-price">
              ₹{Number(product.selling_price).toLocaleString('en-IN')}
            </div>
            {product.mrp && product.mrp > product.selling_price && (
              <div className="qc-card-mrp">
                ₹{Number(product.mrp).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {isOutOfStock ? (
              <button type="button" className="qc-add-btn disabled" disabled>
                OUT
              </button>
            ) : qty === 0 ? (
              <button
                type="button"
                className="qc-add-btn"
                onClick={handleAddClick}
                aria-label={`Add ${product.product_name} to cart`}
              >
                + ADD
              </button>
            ) : (
              <div className="qc-qty-stepper">
                <button
                  type="button"
                  className="qc-stepper-btn"
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                >
                  <Minus size={12} />
                </button>
                <span className="qc-stepper-num">{qty}</span>
                <button
                  type="button"
                  className="qc-stepper-btn"
                  onClick={handleIncrement}
                  disabled={qty >= product.stock}
                  aria-label="Increase quantity"
                  style={{ opacity: qty >= product.stock ? 0.4 : 1 }}
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
