// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
const orderRoutes = require('./routes/orders');
const addressRoutes = require('./routes/addresses');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const pincodeRoutes = require('./routes/pincode');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Body Parsers (preserve rawBody for Razorpay HMAC signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  if (!req.path.startsWith('/assets')) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/pincode', pincodeRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SMARTIFY - Indian Smart Home Marketplace',
    version: '1.0.0',
    currency: 'INR',
    timestamp: new Date().toISOString()
  });
});

// Serve static product assets from public/products directory
const productsPublicPath = path.join(__dirname, '..', 'public', 'products');
if (require('fs').existsSync(productsPublicPath)) {
  app.use('/products', express.static(productsPublicPath));
}

// Serve frontend build if present
const distPath = path.join(__dirname, '..', 'dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/products')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Kuch gadbad ho gayi. Please try again later.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`
=============================================================
  🏠 SMARTIFY - Smart Living. Simple Prices.
  Server running at: http://localhost:${PORT}
  API Base URL: http://localhost:${PORT}/api
  Environment: ${process.env.NODE_ENV || 'development'}
=============================================================
  `);
});
