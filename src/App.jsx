// src/App.jsx
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import MobileStickyCart from './components/MobileStickyCart';
import PincodeModal from './components/PincodeModal';
import AuthModal from './components/AuthModal';
import ProductDetailModal from './components/ProductDetailModal';

// Pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import WishlistPage from './pages/WishlistPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'cart', 'checkout', 'success', 'orders', 'wishlist', 'admin'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  const navigateTo = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleOrderSuccess = (orderId) => {
    setConfirmedOrderId(orderId);
    navigateTo('success');
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        onOpenAdmin={() => navigateTo('admin')}
        onViewOrders={() => navigateTo('orders')}
        onViewWishlist={() => navigateTo('wishlist')}
        onSelectProduct={handleSelectProduct}
      />

      {/* Main Routed Page Content */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' && (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onOpenCart={() => {}}
          />
        )}

        {currentView === 'cart' && (
          <CartPage
            onBackToShopping={() => navigateTo('home')}
            onProceedToCheckout={() => navigateTo('checkout')}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBackToCart={() => navigateTo('cart')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentView === 'success' && (
          <OrderSuccessPage
            orderId={confirmedOrderId}
            onContinueShopping={() => navigateTo('home')}
            onViewOrders={() => navigateTo('orders')}
          />
        )}

        {currentView === 'orders' && (
          <OrdersPage
            onBackToShopping={() => navigateTo('home')}
            onViewOrderDetails={(orderId) => {
              setConfirmedOrderId(orderId);
              navigateTo('success');
            }}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistPage
            onBackToShopping={() => navigateTo('home')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardPage
            onBackToStore={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => navigateTo('checkout')}
        onViewFullCart={() => navigateTo('cart')}
      />

      {/* Mobile Sticky Cart Bar */}
      <MobileStickyCart />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelectRelated={(related) => setSelectedProduct(related)}
        />
      )}

      {/* Pincode Modal */}
      <PincodeModal />

      {/* Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
}
