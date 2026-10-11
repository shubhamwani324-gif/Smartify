// server/routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get current user's orders
router.get('/', authenticate, (req, res) => {
  try {
    const orders = db.getUserOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
});

// Get order details by ID / Order Number
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found (Order nahi mila).' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load order.' });
  }
});

module.exports = router;
