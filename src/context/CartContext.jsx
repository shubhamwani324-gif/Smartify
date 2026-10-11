// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('smartify_cart') || localStorage.getItem('gharva_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartTotals, setCartTotals] = useState({
    items: [],
    item_count: 0,
    mrp_total: 0,
    subtotal: 0,
    product_savings: 0,
    coupon_discount: 0,
    total_savings: 0,
    delivery_fee: 0,
    is_free_delivery: true,
    total: 0,
    coupon: null,
    coupon_error: null,
    stock_warnings: []
  });

  const [couponCode, setCouponCode] = useState(() => localStorage.getItem('smartify_coupon') || localStorage.getItem('gharva_coupon') || '');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with backend calculation whenever items or couponCode change
  const syncWithBackend = useCallback(async (currentItems, currentCoupon) => {
    if (!currentItems || currentItems.length === 0) {
      setCartTotals({
        items: [],
        item_count: 0,
        mrp_total: 0,
        subtotal: 0,
        product_savings: 0,
        coupon_discount: 0,
        total_savings: 0,
        delivery_fee: 0,
        is_free_delivery: true,
        total: 0,
        coupon: null,
        coupon_error: null,
        stock_warnings: []
      });
      return;
    }

    setIsSyncing(true);
    try {
      const payload = currentItems.map(i => ({
        product_id: i.product_id || i.id,
        quantity: i.quantity
      }));
      const totals = await api.calculateCart(payload, currentCoupon);
      setCartTotals(totals);

      // If backend corrected quantities due to stock limits, sync local state
      if (totals.items && totals.items.length > 0) {
        const syncedItems = totals.items.map(t => ({
          product_id: t.product_id,
          id: t.product_id,
          product_name: t.product_name,
          brand: t.brand,
          model: t.model,
          image_url: t.image_url,
          mrp: t.mrp,
          selling_price: t.selling_price,
          quantity: t.quantity,
          stock: t.stock,
          discount_percentage: t.discount_percentage
        }));
        setItems(syncedItems);
        localStorage.setItem('smartify_cart', JSON.stringify(syncedItems));
      }
    } catch (err) {
      console.error('Failed to sync cart with backend:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend(items, couponCode);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('smartify_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (couponCode) {
      localStorage.setItem('smartify_coupon', couponCode);
    } else {
      localStorage.removeItem('smartify_coupon');
      localStorage.removeItem('gharva_coupon');
    }
  }, [couponCode]);

  const addToCart = (product, quantity = 1) => {
    const productId = product.id || product.product_id;
    let nextItems;

    setItems(prev => {
      const existing = prev.find(i => (i.product_id || i.id) === productId);
      if (existing) {
        const maxStock = product.stock || existing.stock || 99;
        const newQty = Math.min(existing.quantity + quantity, maxStock);
        nextItems = prev.map(i =>
          (i.product_id || i.id) === productId ? { ...i, quantity: newQty } : i
        );
      } else {
        const newItem = {
          product_id: productId,
          id: productId,
          product_name: product.product_name,
          brand: product.brand,
          model: product.model,
          image_url: product.image_url,
          mrp: product.mrp,
          selling_price: product.selling_price,
          quantity: Math.min(quantity, product.stock || 99),
          stock: product.stock,
          discount_percentage: product.discount_percentage
        };
        nextItems = [...prev, newItem];
      }
      return nextItems;
    });

    syncWithBackend(nextItems, couponCode);
  };

  const updateQuantity = (productId, newQuantity) => {
    let nextItems;
    setItems(prev => {
      if (newQuantity <= 0) {
        nextItems = prev.filter(i => (i.product_id || i.id) !== productId);
      } else {
        nextItems = prev.map(i => {
          if ((i.product_id || i.id) === productId) {
            const maxStock = i.stock || 99;
            return { ...i, quantity: Math.min(newQuantity, maxStock) };
          }
          return i;
        });
      }
      return nextItems;
    });

    syncWithBackend(nextItems, couponCode);
  };

  const removeFromCart = (productId) => {
    const nextItems = items.filter(i => (i.product_id || i.id) !== productId);
    setItems(nextItems);
    syncWithBackend(nextItems, couponCode);
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode('');
    localStorage.removeItem('smartify_cart');
    localStorage.removeItem('smartify_coupon');
    localStorage.removeItem('gharva_cart');
    localStorage.removeItem('gharva_coupon');
    setCartTotals({
      items: [],
      item_count: 0,
      mrp_total: 0,
      subtotal: 0,
      product_savings: 0,
      coupon_discount: 0,
      total_savings: 0,
      delivery_fee: 0,
      is_free_delivery: true,
      total: 0,
      coupon: null,
      coupon_error: null,
      stock_warnings: []
    });
  };

  const applyCoupon = async (code) => {
    setCouponCode(code);
    await syncWithBackend(items, code);
  };

  const removeCoupon = async () => {
    setCouponCode('');
    await syncWithBackend(items, '');
  };

  const getItemQuantity = (productId) => {
    const item = items.find(i => (i.product_id || i.id) === productId);
    return item ? item.quantity : 0;
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartTotals,
        isCartOpen,
        isSyncing,
        couponCode,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        getItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
