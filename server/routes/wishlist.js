// server/routes/wishlist.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get wishlist products
router.get('/', authenticate, (req, res) => {
  try {
    const products = db.getWishlist(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
});

// Toggle wishlist item
router.post('/toggle', authenticate, (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }
    const result = db.toggleWishlist(req.user.id, product_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
});

module.exports = router;
