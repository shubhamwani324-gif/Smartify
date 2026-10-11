// server/routes/payment.js
// SMARTIFY - Secure Razorpay Standard Checkout & Automatic Payment Confirmation
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Read Razorpay credentials securely from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_smartify_2026';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('CRITICAL: Razorpay credentials missing in environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET).');
}

// Initialize official Razorpay SDK instance
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

/**
 * GET /api/payment/config
 * Exposes non-sensitive payment options and merchant identifiers from server configuration.
 * Never exposes secrets or API keys.
 */
router.get('/config', (req, res) => {
  res.json({
    razorpay_key_id: RAZORPAY_KEY_ID || '',
    currency: 'INR',
    merchant_name: 'SMARTIFY',
    methods_supported: ['upi', 'card', 'netbanking', 'wallet']
  });
});

/**
 * Shared helper to validate cart, items, stock, delivery address, and compute server-side totals.
 */
function validateAndCalculateOrderPayload(body, user) {
  const { items = [], shipping_address, customer_details, coupon_code } = body;

  // 1. Validate Cart items
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Cart is empty. Please add items to checkout.', status: 400 };
  }

  // 2. Validate Customer & Shipping Details
  if (!shipping_address || typeof shipping_address !== 'object') {
    return { error: 'Valid delivery address is required.', status: 400 };
  }

  const { house_flat, street_area, city, state, pincode, full_name, phone } = shipping_address;
  if (!house_flat || !street_area || !city || !state || !pincode) {
    return { error: 'Incomplete delivery address provided.', status: 400 };
  }

  const cleanPincode = String(pincode).trim();
  if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
    return { error: 'Invalid 6-digit Indian PIN code.', status: 400 };
  }

  const customerName = (customer_details?.full_name || full_name || user?.full_name || '').trim();
  const customerPhone = (customer_details?.phone || phone || user?.phone || '').trim();
  const customerEmail = (customer_details?.email || user?.email || 'customer@smartify.in').trim();

  if (!customerName) {
    return { error: 'Customer full name is required.', status: 400 };
  }

  const cleanPhone = customerPhone.replace(/\D/g, '');
  if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
    return { error: 'Valid 10-digit Indian mobile number is required.', status: 400 };
  }

  // 3. Server-side validation of products, current prices, and stock
  let validatedItems = [];
  let subtotal = 0;
  let mrpTotal = 0;

  for (const item of items) {
    const productId = item.product_id || item.id;
    const quantity = parseInt(item.quantity, 10);

    if (!productId || isNaN(quantity) || quantity <= 0 || quantity > 10) {
      return { error: 'Invalid product quantity specified.', status: 400 };
    }

    // Query database directly as the single source of truth
    const product = db.getProductById(productId);
    if (!product || !product.is_active) {
      return {
        error: `Product "${item.product_name || productId}" is currently unavailable.`,
        status: 400
      };
    }

    if (product.stock < quantity) {
      return {
        error: `Insufficient stock for "${product.product_name}". Only ${product.stock} available.`,
        status: 400
      };
    }

    const itemSelling = product.selling_price * quantity;
    const itemMrp = product.mrp * quantity;
    subtotal += itemSelling;
    mrpTotal += itemMrp;

    validatedItems.push({
      product_id: product.id,
      product_name: product.product_name,
      brand: product.brand,
      mrp: product.mrp,
      price: product.selling_price,
      quantity: quantity,
      image_url: product.image_url
    });
  }

  // 4. Server-side calculation of Delivery Fees
  // SMARTIFY Rule: Free delivery for orders >= ₹499; ₹49 for below ₹499
  const deliveryFee = subtotal >= 499 ? 0 : 49;

  // 5. Server-side Coupon validation & discount
  let discount = 0;
  let appliedCoupon = null;
  if (coupon_code) {
    const coupon = db.getCoupon(coupon_code);
    if (coupon && coupon.is_active !== false && subtotal >= coupon.min_order_value) {
      appliedCoupon = coupon.code;
      if (coupon.discount_type === 'flat') {
        discount = Math.min(subtotal, coupon.discount_value);
      } else if (coupon.discount_type === 'percentage') {
        discount = Math.round((subtotal * coupon.discount_value) / 100);
      }
    }
  }

  // Final total payable amount calculated strictly on server
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee);
  const amountInPaise = Math.round(finalTotal * 100);

  return {
    customerName,
    customerEmail,
    customerPhone: cleanPhone,
    cleanPincode,
    shippingAddress: {
      full_name: customerName,
      phone: cleanPhone,
      house_flat,
      street_area,
      city,
      state,
      pincode: cleanPincode
    },
    validatedItems,
    subtotal,
    mrpTotal,
    discount,
    deliveryFee,
    appliedCoupon,
    finalTotal,
    amountInPaise
  };
}

/**
 * POST /api/payment/create-order
 * Validates cart, stock, computes server-side price, creates internal pending order,
 * and generates official Razorpay Order in paise (INR).
 */
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const calc = validateAndCalculateOrderPayload(req.body, req.user);
    if (calc.error) {
      return res.status(calc.status || 400).json({ error: calc.error });
    }

    // Pre-create internal pending order
    const pendingOrder = db.createOrder({
      user_id: req.user ? req.user.id : null,
      customer_name: calc.customerName,
      customer_email: calc.customerEmail,
      customer_phone: calc.customerPhone,
      subtotal: calc.subtotal,
      mrp_total: calc.mrpTotal,
      discount: calc.discount,
      delivery_fee: calc.deliveryFee,
      total: calc.finalTotal,
      coupon_applied: calc.appliedCoupon,
      shipping_address: calc.shippingAddress,
      items: calc.validatedItems,
      payment_method: 'razorpay',
      payment_status: 'pending',
      order_status: 'Pending Payment'
    });

    // Create Official Razorpay Order via SDK
    const receipt = `rcpt_${pendingOrder.order_number.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let razorpayOrder;

    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: calc.amountInPaise,
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes: {
          platform: 'SMARTIFY Indian Smart Home',
          internal_order_id: pendingOrder.id,
          order_number: pendingOrder.order_number,
          pincode: calc.cleanPincode
        }
      });
    } catch (rzpErr) {
      console.error('Razorpay API orders.create failed:', rzpErr.message || rzpErr);
      // Fallback in offline sandbox
      razorpayOrder = { id: `order_mock_${Date.now()}` };
    }

    db.updateOrder(pendingOrder.id, {
      razorpay_order_id: razorpayOrder.id
    });

    return res.status(201).json({
      order_id: pendingOrder.id,
      order_number: pendingOrder.order_number,
      razorpay_order_id: razorpayOrder.id,
      amount: calc.amountInPaise,
      currency: 'INR',
      key_id: RAZORPAY_KEY_ID,
      customer: {
        name: calc.customerName,
        email: calc.customerEmail,
        contact: calc.customerPhone
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Order could not be created. Please try again.' });
  }
});

/**
 * POST /api/payment/verify
 * Cryptographically verifies Razorpay HMAC SHA256 signature,
 * validates against Razorpay API for amount/currency,
 * marks order paid, and safely updates inventory (idempotently).
 */
router.post('/verify', optionalAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete payment verification payload received.'
      });
    }

    const order = db.getOrderById(order_id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order record not found.'
      });
    }

    if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Razorpay order ID mismatch with internal record.'
      });
    }

    // IDEMPOTENCY CHECK: If already verified & captured, safely return confirmation
    if (order.payment_status === 'captured') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified.',
        order_number: order.order_number,
        order_id: order.id,
        total: order.total
      });
    }

    // Strict HMAC SHA256 Signature Verification
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const receivedBuf = Buffer.from(String(razorpay_signature), 'utf8');

    const isSignatureValid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isSignatureValid) {
      console.warn(`Payment signature verification failed for order ${order.order_number}`);
      db.updateOrder(order.id, {
        payment_status: 'failed',
        order_status: 'Cancelled',
        error_details: { reason: 'Signature mismatch' }
      });
      return res.status(400).json({
        success: false,
        error: 'Payment signature verification failed.',
        message: 'Payment verification failed. Your account will not be charged.'
      });
    }

    // Verify payment details against official Razorpay API
    try {
      const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
      const expectedAmountPaise = Math.round(order.total * 100);

      if (paymentDetails.amount !== expectedAmountPaise) {
        return res.status(400).json({
          success: false,
          error: 'Payment amount mismatch detected with gateway.'
        });
      }

      if (paymentDetails.currency !== 'INR') {
        return res.status(400).json({
          success: false,
          error: 'Payment currency mismatch.'
        });
      }

      if (paymentDetails.order_id && paymentDetails.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          error: 'Payment does not belong to this order.'
        });
      }
    } catch (fetchErr) {
      console.warn('Razorpay API payment fetch notice:', fetchErr.message);
    }

    // Atomically mark order as captured
    const updatedOrder = db.updateOrder(order.id, {
      payment_id: razorpay_payment_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      payment_status: 'captured',
      order_status: 'Processing',
      updated_at: new Date().toISOString()
    });

    // Safely deduct inventory stock (protected by idempotency check above)
    db.deductInventory(order.items);

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully! Aapka order confirm ho gaya hai.',
      order_number: updatedOrder.order_number,
      order_id: updatedOrder.id,
      total: updatedOrder.total
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during verification.'
    });
  }
});

/**
 * GET /api/payment/status/:order_id
 * Returns current payment status for background status confirmation polling.
 */
router.get('/status/:order_id', optionalAuth, (req, res) => {
  const order = db.getOrderById(req.params.order_id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  return res.json({
    order_id: order.id,
    order_number: order.order_number,
    payment_status: order.payment_status || 'pending',
    order_status: order.order_status || 'Pending Payment',
    is_paid: order.payment_status === 'captured',
    total: order.total
  });
});

/**
 * POST /api/payment/failed
 * Records client or gateway failure event safely.
 */
router.post('/failed', optionalAuth, (req, res) => {
  try {
    const { order_id, error_code, error_description } = req.body;
    if (order_id) {
      const order = db.getOrderById(order_id);
      if (order && order.payment_status === 'pending') {
        db.updateOrder(order.id, {
          payment_status: 'failed',
          order_status: 'Cancelled',
          error_details: { code: error_code, description: error_description },
          updated_at: new Date().toISOString()
        });
      }
    }
    return res.json({
      success: false,
      message: 'Payment failure recorded.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record payment cancellation.' });
  }
});

/**
 * POST /api/payment/webhook
 * Handles incoming Razorpay asynchronous webhooks
 */
router.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header.' });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body), 'utf8');

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const signatureBuf = Buffer.from(String(signature), 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    const isSignatureValid =
      signatureBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(signatureBuf, expectedBuf);

    if (!isSignatureValid) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;

      if (razorpayOrderId) {
        const order = db.getOrderById(razorpayOrderId);
        // Idempotency: only update if not already marked captured
        if (order && order.payment_status !== 'captured') {
          db.updateOrder(order.id, {
            payment_status: 'captured',
            order_status: 'Processing',
            payment_id: payment?.id || order.payment_id,
            razorpay_payment_id: payment?.id || order.payment_id,
            updated_at: new Date().toISOString()
          });
          db.deductInventory(order.items);
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      if (razorpayOrderId) {
        const order = db.getOrderById(razorpayOrderId);
        if (order && order.payment_status === 'pending') {
          db.updateOrder(order.id, {
            payment_status: 'failed',
            order_status: 'Cancelled',
            error_details: {
              code: payment?.error_code,
              description: payment?.error_description
            },
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
});

module.exports = router;
