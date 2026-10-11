// server/routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Calculate Cart Totals (Server-side validation & truth)
router.post('/calculate', optionalAuth, (req, res) => {
  try {
    const { items = [], coupon_code } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid cart payload format.' });
    }

    let calculatedItems = [];
    let mrpTotal = 0;
    let sellingSubtotal = 0;
    let stockErrors = [];

    for (const item of items) {
      const product = db.getProductById(item.product_id);
      if (!product || !product.is_active) {
        stockErrors.push({
          product_id: item.product_id,
          message: 'Product is currently unavailable.'
        });
        continue;
      }

      const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const availableStock = product.stock;

      if (availableStock <= 0) {
        stockErrors.push({
          product_id: product.id,
          product_name: product.product_name,
          message: 'Out of Stock (Stock khatam ho gaya hai).'
        });
        continue;
      }

      const finalQty = Math.min(requestedQty, availableStock);
      if (finalQty < requestedQty) {
        stockErrors.push({
          product_id: product.id,
          product_name: product.product_name,
          message: `Only ${availableStock} units available in stock.`
        });
      }

      const itemMrpTotal = product.mrp * finalQty;
      const itemSellingTotal = product.selling_price * finalQty;

      mrpTotal += itemMrpTotal;
      sellingSubtotal += itemSellingTotal;

      calculatedItems.push({
        product_id: product.id,
        product_name: product.product_name,
        brand: product.brand,
        model: product.model,
        image_url: product.image_url,
        mrp: product.mrp,
        selling_price: product.selling_price,
        discount_percentage: product.discount_percentage,
        quantity: finalQty,
        stock: product.stock,
        item_total: itemSellingTotal,
        item_mrp_total: itemMrpTotal
      });
    }

    // Delivery Fee: Free if subtotal >= ₹499, else ₹49
    const deliveryFee = sellingSubtotal >= 499 || sellingSubtotal === 0 ? 0 : 49;

    // Coupon calculation
    let couponDiscount = 0;
    let couponDetails = null;
    let couponError = null;

    if (coupon_code) {
      const coupon = db.getCoupon(coupon_code);
      if (!coupon) {
        couponError = 'Invalid coupon code (Coupon code sahi nahi hai).';
      } else if (sellingSubtotal < coupon.min_order_value) {
        couponError = `Minimum order of ₹${coupon.min_order_value} required for this coupon.`;
      } else {
        if (coupon.discount_type === 'flat') {
          couponDiscount = Math.min(sellingSubtotal, coupon.discount_value);
        } else if (coupon.discount_type === 'percentage') {
          couponDiscount = Math.round((sellingSubtotal * coupon.discount_value) / 100);
        }
        couponDetails = {
          code: coupon.code,
          discount_amount: couponDiscount
        };
      }
    }

    const productSavings = Math.max(0, mrpTotal - sellingSubtotal);
    const totalSavings = productSavings + couponDiscount;
    const finalTotal = Math.max(0, sellingSubtotal - couponDiscount + deliveryFee);

    res.json({
      items: calculatedItems,
      item_count: calculatedItems.reduce((acc, i) => acc + i.quantity, 0),
      mrp_total: mrpTotal,
      subtotal: sellingSubtotal,
      product_savings: productSavings,
      coupon_discount: couponDiscount,
      total_savings: totalSavings,
      delivery_fee: deliveryFee,
      is_free_delivery: deliveryFee === 0,
      free_delivery_threshold: 499,
      free_delivery_needed: Math.max(0, 499 - sellingSubtotal),
      total: finalTotal,
      coupon: couponDetails,
      coupon_error: couponError,
      stock_warnings: stockErrors
    });
  } catch (err) {
    console.error('Cart calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate cart.' });
  }
});

module.exports = router;
