// server/test_razorpay.js
// Comprehensive Razorpay Integration Test Suite for SMARTIFY
const http = require('http');
const crypto = require('crypto');
require('dotenv').config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_gharva_2026';

console.log('Testing with Key ID:', RAZORPAY_KEY_ID);
console.log('Testing with Secret:', RAZORPAY_KEY_SECRET ? '*** configured ***' : 'MISSING');

function post(endpoint, data, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...customHeaders
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${endpoint}`, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('  SMARTIFY — RAZORPAY END-TO-END TEST SUITE');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, extra = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ [PASS] ${testName}`);
    } else {
      console.error(`  ✗ [FAIL] ${testName}`, extra);
    }
  }

  try {
    // TEST 1: Check API health
    const health = await get('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Server health is online');

    // TEST 2: Rejection on empty cart
    const emptyOrderRes = await post('/api/payment/create-order', {
      items: [],
      shipping_address: {
        house_flat: '101', street_area: 'Road', city: 'Delhi', state: 'Delhi', pincode: '110001'
      }
    });
    assert(emptyOrderRes.status === 400, 'Rejects create-order with empty cart');

    // TEST 3: Rejection on invalid pincode
    const badPincodeRes = await post('/api/payment/create-order', {
      items: [{ product_id: 'p-01', quantity: 1 }],
      shipping_address: {
        house_flat: '101', street_area: 'Road', city: 'Delhi', state: 'Delhi', pincode: '000000',
        full_name: 'Amit', phone: '9876543210'
      }
    });
    assert(badPincodeRes.status === 400, 'Rejects create-order with invalid 6-digit Indian PIN');

    // TEST 4: Out-of-stock rejection
    const outOfStockRes = await post('/api/payment/create-order', {
      items: [{ product_id: 'p-01', quantity: 999 }],
      shipping_address: {
        house_flat: '101', street_area: 'Road', city: 'Delhi', state: 'Delhi', pincode: '110001',
        full_name: 'Amit', phone: '9876543210'
      }
    });
    assert(outOfStockRes.status === 400, 'Rejects create-order when quantity exceeds stock');

    // TEST 5: Legitimate Order Creation with Real Razorpay Order ID
    const validOrderRes = await post('/api/payment/create-order', {
      items: [
        { product_id: 'p-01', quantity: 1 } // Philips WiZ bulb (selling price 649)
      ],
      shipping_address: {
        house_flat: 'Flat 304, Green Heights',
        street_area: 'MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      customer_details: {
        full_name: 'Ananya Verma',
        email: 'ananya@example.in',
        phone: '9876543210'
      }
    });

    assert(
      validOrderRes.status === 201 &&
      validOrderRes.data.razorpay_order_id &&
      validOrderRes.data.razorpay_order_id.startsWith('order_'),
      'Creates legitimate Razorpay order with order_ ID from gateway',
      validOrderRes.data
    );

    const orderId = validOrderRes.data.order_id;
    const razorpayOrderId = validOrderRes.data.razorpay_order_id;
    const amountInPaise = validOrderRes.data.amount;

    assert(
      validOrderRes.data.key_id === RAZORPAY_KEY_ID,
      'Returns official public Razorpay Key ID to frontend',
      validOrderRes.data.key_id
    );

    assert(
      validOrderRes.data.currency === 'INR',
      'Currency is strictly INR',
      validOrderRes.data.currency
    );

    // TEST 6: Server calculates correct price in paise (p-01 selling price = 599 INR = 59900 paise, free delivery on >= 499)
    assert(
      amountInPaise === 59900,
      'Calculated amount on server matches catalog price (59900 paise)',
      amountInPaise
    );

    // TEST 7: Fake / Tampered Signature Rejection
    const tamperedVerifyRes = await post('/api/payment/verify', {
      order_id: orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_tampered_123',
      razorpay_signature: 'invalid_sha256_hex_signature_string_00000000000000000000000000000000'
    });

    assert(
      tamperedVerifyRes.status === 400 && tamperedVerifyRes.data.success === false,
      'Rejects payment verification when signature is tampered/invalid',
      tamperedVerifyRes.data
    );

    // TEST 8: Valid HMAC SHA256 Signature Verification
    const realPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${realPaymentId}`)
      .digest('hex');

    const validVerifyRes = await post('/api/payment/verify', {
      order_id: orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: realPaymentId,
      razorpay_signature: validSignature
    });

    assert(
      validVerifyRes.status === 200 && validVerifyRes.data.success === true,
      'Cryptographically verifies valid HMAC SHA256 signature and marks paid',
      validVerifyRes.data
    );

    // TEST 9: Idempotency (repeated verification call)
    const repeatedVerifyRes = await post('/api/payment/verify', {
      order_id: orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: realPaymentId,
      razorpay_signature: validSignature
    });

    assert(
      repeatedVerifyRes.status === 200 &&
      repeatedVerifyRes.data.success === true &&
      repeatedVerifyRes.data.message === 'Payment already verified.',
      'Idempotent verification handles duplicate callbacks safely without error or double-deduction'
    );

    // TEST 10: Razorpay Order ID mismatch protection
    const mismatchVerifyRes = await post('/api/payment/verify', {
      order_id: orderId,
      razorpay_order_id: 'order_DIFFERENT_12345',
      razorpay_payment_id: realPaymentId,
      razorpay_signature: validSignature
    });

    assert(
      mismatchVerifyRes.status === 400,
      'Rejects payment verification when Razorpay order ID does not match internal record'
    );

    // TEST 11: Webhook - Reject unauthenticated / bad signature
    const badWebhookRes = await post('/api/payment/webhook', {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_fake', order_id: 'order_fake' } } }
    }, {
      'x-razorpay-signature': 'bad_webhook_sig'
    });

    assert(
      badWebhookRes.status === 400,
      'Rejects webhook with invalid or tampered signature'
    );

    // TEST 12: Webhook - Process verified webhook with valid HMAC SHA256
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_wh_' + Date.now(),
            order_id: razorpayOrderId,
            amount: 64900,
            currency: 'INR'
          }
        }
      }
    });

    const validWebhookSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(Buffer.from(webhookPayload, 'utf8'))
      .digest('hex');

    const validWebhookRes = await post('/api/payment/webhook', webhookPayload, {
      'x-razorpay-signature': validWebhookSig
    });

    assert(
      validWebhookRes.status === 200 && validWebhookRes.data.status === 'ok',
      'Verifies and processes authentic Razorpay webhook event'
    );

    // TEST 13: Payment Failure endpoint records cancellation
    const failOrderRes = await post('/api/payment/create-order', {
      items: [{ product_id: 'p-07', quantity: 1 }],
      shipping_address: {
        house_flat: 'Flat 2', street_area: 'Area', city: 'Delhi', state: 'Delhi', pincode: '110001',
        full_name: 'Rohan', phone: '9876543210'
      }
    });

    const failRecordRes = await post('/api/payment/failed', {
      order_id: failOrderRes.data.order_id,
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Payment was cancelled by customer'
    });

    assert(
      failRecordRes.status === 200 && failRecordRes.data.success === false,
      'Records explicit payment failure/cancellation'
    );

    console.log('\n=============================================================');
    console.log(`  TEST RESULTS: ${passed}/${total} PASSED`);
    console.log('=============================================================\n');

    if (passed === total) {
      console.log('🎉 ALL RAZORPAY TESTS PASSED PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error('❌ SOME TESTS FAILED!\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
