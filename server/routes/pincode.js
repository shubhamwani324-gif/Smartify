// server/routes/pincode.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Check delivery availability for Indian 6-digit Pincode
router.get('/check/:pincode', (req, res) => {
  try {
    const { pincode } = req.params;
    const result = db.checkPincode(pincode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify pincode.' });
  }
});

module.exports = router;
