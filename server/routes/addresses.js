// server/routes/addresses.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get saved addresses
router.get('/', authenticate, (req, res) => {
  try {
    const addresses = db.getUserAddresses(req.user.id);
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch addresses.' });
  }
});

// Add new address
router.post('/', authenticate, (req, res) => {
  try {
    const { full_name, phone, house_flat, street_area, city, state, pincode, is_default } = req.body;

    if (!full_name || !phone || !house_flat || !street_area || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Please fill in all address fields.' });
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code.' });
    }

    const newAddress = db.addAddress(req.user.id, {
      full_name,
      phone,
      house_flat,
      street_area,
      city,
      state,
      pincode,
      is_default: Boolean(is_default)
    });

    res.status(201).json(newAddress);
  } catch (err) {
    console.error('Error adding address:', err);
    res.status(500).json({ error: 'Failed to save address.' });
  }
});

// Delete address
router.delete('/:id', authenticate, (req, res) => {
  try {
    const success = db.deleteAddress(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Address not found.' });
    }
    res.json({ message: 'Address removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete address.' });
  }
});

module.exports = router;
