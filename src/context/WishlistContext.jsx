// src/context/WishlistContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('smartify_wishlist') || localStorage.getItem('gharva_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistProducts, setWishlistProducts] = useState([]);

  useEffect(() => {
    localStorage.setItem('smartify_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  // If user is authenticated, fetch synced wishlist from server
  useEffect(() => {
    async function loadServerWishlist() {
      if (!token) return;
      try {
        const prods = await api.getWishlist();
        setWishlistProducts(prods);
        setWishlistIds(prods.map(p => p.id));
      } catch (err) {
        console.warn('Could not load user wishlist from server');
      }
    }
    loadServerWishlist();
  }, [token]);

  const toggleWishlist = async (product) => {
    const productId = typeof product === 'string' ? product : product.id;
    const isPresent = wishlistIds.includes(productId);

    // Optimistic update
    setWishlistIds(prev =>
      isPresent ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    if (token) {
      try {
        await api.toggleWishlist(productId);
      } catch (err) {
        console.error('Failed to sync wishlist on server:', err);
      }
    }
  };

  const isWishlisted = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        wishlistProducts,
        toggleWishlist,
        isWishlisted
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
