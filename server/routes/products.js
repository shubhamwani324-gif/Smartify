// server/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// List Products with search, filtering, and sorting
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      min_price,
      max_price,
      sort,
      is_combo,
      page = 1,
      limit = 24
    } = req.query;

    const allProducts = db.getProducts({
      search,
      category,
      brand,
      min_price,
      max_price,
      sort,
      is_combo: is_combo === 'true' ? true : undefined
    });

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + limitNum);

    res.json({
      total: allProducts.length,
      page: pageNum,
      totalPages: Math.ceil(allProducts.length / limitNum),
      products: paginatedProducts
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products catalog.' });
  }
});

// Deals Highlights (Under ₹499, Under ₹999, Top Discounts, Combos)
router.get('/deals/highlights', (req, res) => {
  try {
    const all = db.getProducts({ is_active: true });

    const under499 = all.filter(p => p.selling_price <= 499).slice(0, 8);
    const under999 = all.filter(p => p.selling_price > 499 && p.selling_price <= 999).slice(0, 8);
    const topDiscounts = [...all].sort((a, b) => b.discount_percentage - a.discount_percentage).slice(0, 8);
    const combos = all.filter(p => p.is_combo === true);
    const essentials = all.filter(p => p.rating >= 4.7).slice(0, 8);

    res.json({
      under499,
      under999,
      topDiscounts,
      combos,
      essentials
    });
  } catch (err) {
    console.error('Error fetching deals:', err);
    res.status(500).json({ error: 'Failed to fetch deals.' });
  }
});

// Categories list
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Brands list
router.get('/meta/brands', (req, res) => {
  try {
    const brands = db.getBrands();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
});

// Single Product Details
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found. Yeh product uplabdh nahi hai.' });
    }

    // Get related products in the same category
    const related = db.getProducts({ category: product.category_slug })
      .filter(p => p.id !== product.id)
      .slice(0, 6);

    const reviews = db.getReviewsByProduct(product.id);

    res.json({
      product,
      related,
      reviews
    });
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Failed to load product.' });
  }
});

module.exports = router;
