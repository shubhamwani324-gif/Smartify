// src/components/ProductDetailModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Heart,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  Shield,
  RotateCcw,
  Zap,
  Info,
  Layers,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ProductImage from './ProductImage';

export default function ProductDetailModal({ product: initialProduct, onClose, onSelectRelated }) {
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { pincodeData, openPincodeModal } = useLocation();
  const { user, openAuthModal } = useAuth();

  const [productData, setProductData] = useState(initialProduct);
  const [activeImage, setActiveImage] = useState(initialProduct?.image_url);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isEligibleToReview, setIsEligibleToReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

  // Fetch full details, related products, and reviews
  useEffect(() => {
    if (!initialProduct?.id) return;
    setActiveImage(initialProduct.image_url);
    setQuantity(1);

    async function loadDetails() {
      try {
        const res = await api.getProduct(initialProduct.id);
        if (res.product) setProductData(res.product);
        if (res.reviews) setReviews(res.reviews);
        if (res.related) setRelatedProducts(res.related);
      } catch (err) {
        console.error('Failed to load full product info:', err);
      }
    }
    loadDetails();
  }, [initialProduct?.id]);

  // Check if current user is eligible to write a review
  useEffect(() => {
    if (!user || !initialProduct?.id) {
      setIsEligibleToReview(false);
      return;
    }
    async function checkEligibility() {
      try {
        const res = await api.checkReviewEligibility(initialProduct.id);
        setIsEligibleToReview(res.eligible);
      } catch {
        setIsEligibleToReview(false);
      }
    }
    checkEligibility();
  }, [user, initialProduct?.id]);

  if (!productData) return null;

  const wishlisted = isWishlisted(productData.id);
  const isOutOfStock = productData.stock <= 0;
  const gallery = productData.gallery_images?.length ? productData.gallery_images : [productData.image_url];

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(productData, quantity);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      addToCart(productData, quantity);
      onClose();
      openCart();
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await api.addReview({
        product_id: productData.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews([res.review, ...reviews]);
      setReviewComment('');
      setReviewMessage({ type: 'success', text: 'Shukriya! Aapka review submit ho gaya hai.' });
    } catch (err) {
      setReviewMessage({ type: 'error', text: err.message || 'Review submit nahi ho paya.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content-card"
        style={{ maxWidth: '860px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: '#f1f5f9',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            color: '#475569'
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ padding: '1.5rem' }}>
          {/* Main Top Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
            {/* Left: Gallery */}
            <div>
              <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#f8fafc', border: '1px solid var(--color-charcoal-200)', marginBottom: '0.75rem' }}>
                <ProductImage
                  productId={productData.id}
                  src={activeImage}
                  alt={productData.product_name}
                  categorySlug={productData.category_slug}
                  fit="contain"
                  aspectRatio="1 / 1"
                  eager={true}
                />
              </div>

              {gallery.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        border: activeImage === img ? '2px solid var(--color-primary)' : '1px solid var(--color-charcoal-200)',
                        padding: 0,
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      <ProductImage
                        productId={productData.id}
                        src={img}
                        alt={`${productData.product_name} thumbnail`}
                        categorySlug={productData.category_slug}
                        fit="contain"
                        aspectRatio="1 / 1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Pricing */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-charcoal-500)', letterSpacing: '0.05em' }}>
                  {productData.brand} • {productData.model}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(productData)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: wishlisted ? 'var(--color-danger)' : 'var(--color-charcoal-500)', fontWeight: 600 }}
                >
                  <Heart size={16} fill={wishlisted ? 'var(--color-danger)' : 'none'} />
                  {wishlisted ? 'Saved' : 'Save'}
                </button>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-charcoal-900)', marginBottom: '0.65rem', lineHeight: 1.3 }}>
                {productData.product_name}
              </h2>

              {/* Rating & Reviews */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span className="rating-pill">
                  <Star size={13} fill="#eab308" color="#eab308" />
                  {productData.rating}
                </span>
                <span style={{ color: 'var(--color-charcoal-500)' }}>
                  ({productData.review_count} Customer Ratings)
                </span>
                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.78rem' }}>
                  ✓ 100% Genuine
                </span>
              </div>

              {/* Price Row */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-charcoal-200)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="inr-price" style={{ fontSize: '1.6rem', color: 'var(--color-charcoal-900)' }}>
                    ₹{productData.selling_price.toLocaleString('en-IN')}
                  </span>
                  {productData.mrp > productData.selling_price && (
                    <span className="inr-mrp" style={{ fontSize: '1rem' }}>
                      MRP: ₹{productData.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                  {productData.discount_percentage > 0 && (
                    <span className="discount-badge" style={{ fontSize: '0.85rem' }}>
                      {productData.discount_percentage}% OFF
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                  Aap bacha rahe hain ₹{(productData.mrp - productData.selling_price).toLocaleString('en-IN')}!
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-charcoal-500)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} /> Price updated recently • Price Source: {productData.price_source || 'Admin'}
                </div>
              </div>

              {/* Pincode Delivery Estimate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Truck size={18} color="var(--color-primary)" />
                  <div>
                    <span style={{ fontWeight: 600 }}>Deliver to: </span>
                    <span>{pincodeData.pincode} ({pincodeData.city})</span>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                      Delivery available in {pincodeData.estimated_days || '2-3 days'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openPincodeModal}
                  style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}
                >
                  Change
                </button>
              </div>

              {/* Stock Status */}
              <div style={{ marginBottom: '1.25rem' }}>
                {isOutOfStock ? (
                  <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.9rem' }}>
                    Out of Stock (Currently Unavailable)
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    <span style={{ fontWeight: 600, color: '#15803d', fontSize: '0.85rem' }}>
                      In Stock ({productData.stock} units available)
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity & CTA Buttons */}
              {!isOutOfStock && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ padding: '0.6rem 0.8rem', background: '#f8fafc' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ padding: '0 0.8rem', fontWeight: 700, fontSize: '0.9rem' }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(productData.stock, quantity + 1))}
                      style={{ padding: '0.6rem 0.8rem', background: '#f8fafc' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleAddToCart}
                  >
                    Cart mein add karein
                  </button>

                  {/* Buy Now */}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
                    onClick={handleBuyNow}
                  >
                    Abhi Kharidein
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description & Features Tabs */}
          <div style={{ borderTop: '1px solid var(--color-charcoal-200)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Product Description</h3>
            <p style={{ color: 'var(--color-charcoal-700)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {productData.description}
            </p>

            {/* Key Features */}
            {productData.features?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.65rem', fontWeight: 700 }}>Key Features</h4>
                <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
                  {productData.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-charcoal-800)' }}>
                      <CheckCircle size={15} color="var(--color-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compatibility & What's in the Box */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-charcoal-900)' }}>
                  Compatibility
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-700)' }}>
                  {productData.compatibility || 'Works with Alexa, Google Assistant, iOS & Android'}
                </p>
              </div>

              {productData.whats_in_the_box?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-charcoal-900)' }}>
                    What's in the Box
                  </h4>
                  <ul style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-700)', paddingLeft: '1.2rem' }}>
                    {productData.whats_in_the_box.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            {productData.specifications && Object.keys(productData.specifications).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.65rem', fontWeight: 700 }}>Technical Specifications</h4>
                <div style={{ border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {Object.entries(productData.specifications).map(([key, value], idx) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.82rem',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: idx === Object.keys(productData.specifications).length - 1 ? 'none' : '1px solid var(--color-charcoal-200)'
                      }}
                    >
                      <span style={{ width: '40%', fontWeight: 600, color: 'var(--color-charcoal-700)' }}>{key}</span>
                      <span style={{ width: '60%', color: 'var(--color-charcoal-900)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Verified Buyer Reviews Section */}
          <div style={{ borderTop: '1px solid var(--color-charcoal-200)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Customer Reviews ({reviews.length})</h3>
              <span className="rating-pill">⭐ {productData.rating} Out of 5</span>
            </div>

            {/* Review Submission for Verified Buyers */}
            {user ? (
              isEligibleToReview ? (
                <form onSubmit={handleSubmitReview} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-charcoal-200)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Write a Verified Buyer Review (Aapka anubhav share karein)
                  </h4>
                  {reviewMessage && (
                    <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.82rem', backgroundColor: reviewMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: reviewMessage.type === 'success' ? '#15803d' : '#b91c1c' }}>
                      {reviewMessage.text}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{ color: star <= reviewRating ? '#eab308' : '#cbd5e1' }}
                      >
                        <Star size={20} fill={star <= reviewRating ? '#eab308' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Share honest feedback about installation, speed, quality..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '0.75rem' }}
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={submittingReview} style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-charcoal-600)', marginBottom: '1rem' }}>
                  ℹ️ Only customers who purchased this item on SMARTIFY can submit a verified review.
                </div>
              )
            ) : (
              <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-charcoal-600)', marginBottom: '1rem' }}>
                <a href="#login" onClick={(e) => { e.preventDefault(); openAuthModal(); }} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                  Sign In
                </a> to write a review if you purchased this product.
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--color-charcoal-500)', fontSize: '0.85rem' }}>No reviews yet. Be the first verified buyer to review!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={{ borderBottom: '1px solid var(--color-charcoal-100)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{rev.user_name}</span>
                        {rev.verified_purchase && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            ✓ Verified Buyer
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={13} fill="#eab308" color="#eab308" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-700)', lineHeight: 1.4 }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-charcoal-200)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Customers Also Bought</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated && onSelectRelated(rel)}
                    style={{ border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <ProductImage
                      productId={rel.id}
                      src={rel.image_url}
                      alt={rel.product_name}
                      categorySlug={rel.category_slug}
                      fit="contain"
                      aspectRatio="1/1"
                    />
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rel.product_name}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-charcoal-900)' }}>
                      ₹{rel.selling_price.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
