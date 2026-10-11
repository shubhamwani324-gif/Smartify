// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get reviews for product
router.get('/:productId', (req, res) => {
  try {
    const reviews = db.getReviewsByProduct(req.params.productId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Check if user is eligible to review (verified buyer check)
router.get('/eligibility/:productId', authenticate, (req, res) => {
  try {
    const hasPurchased = db.hasPurchasedProduct(req.user.id, req.params.productId);
    res.json({ eligible: hasPurchased });
  } catch (err) {
    res.status(500).json({ error: 'Error checking eligibility.' });
  }
});

// Post review (Must be authenticated and verified buyer)
router.post('/', authenticate, (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    // Verified buyer check
    const hasPurchased = db.hasPurchasedProduct(req.user.id, product_id);
    if (!hasPurchased) {
      return res.status(403).json({
        error: 'Only customers who purchased this item can submit a review (Sirf verified buyers review de sakte hain).'
      });
    }

    const review = db.addReview({
      product_id,
      user_id: req.user.id,
      user_name: req.user.full_name,
      rating: numRating,
      comment: comment.trim()
    });

    res.status(201).json({
      message: 'Review submitted successfully! Thank you for sharing your feedback.',
      review
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to save review.' });
  }
});

module.exports = router;
