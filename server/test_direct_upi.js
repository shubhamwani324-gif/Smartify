// server/test_direct_upi.js
// Comprehensive Direct UPI Integration & Verification Test Suite for SMARTIFY
const http = require('http');
require('dotenv').config();

const EXPECTED_UPI_ID = process.env.DIRECT_UPI_ID || '8468990113@ibl';
const EXPECTED_MERCHANT = process.env.DIRECT_UPI_MERCHANT_NAME || 'SMARTIFY';

console.log('Testing Direct UPI Integration with:');
console.log('  UPI ID:', EXPECTED_UPI_ID);
console.log('  Merchant:', EXPECTED_MERCHANT);

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

function get(endpoint, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      headers: customHeaders
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
    req.end();
  });
}

async function runDirectUpiTests() {
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  console.log('\n--- SUITE 1: Payment Configuration Endpoint ---');
  try {
    const cfgRes = await get('/api/payment/config');
    assert('GET /api/payment/config returns HTTP 200', cfgRes.status === 200);
    assert(`Config contains correct direct_upi_id (${EXPECTED_UPI_ID})`, cfgRes.data.direct_upi_id === EXPECTED_UPI_ID);
    assert(`Config contains correct merchant name (${EXPECTED_MERCHANT})`, cfgRes.data.direct_upi_merchant === EXPECTED_MERCHANT);
    assert('Config does NOT expose any private secrets', !cfgRes.data.RAZORPAY_KEY_SECRET && !cfgRes.data.key_secret && !cfgRes.data.jwt_secret);
  } catch (err) {
    assert('Payment config call failed: ' + err.message, false);
  }

  console.log('\n--- SUITE 2: Direct UPI Order Creation & Validation ---');
  // Test invalid empty cart
  const emptyRes = await post('/api/payment/create-direct-upi-order', { items: [] });
  assert('Empty cart rejected with HTTP 400', emptyRes.status === 400);

  // Test invalid pincode
  const badPinRes = await post('/api/payment/create-direct-upi-order', {
    items: [{ product_id: 'p-01', quantity: 1 }],
    shipping_address: {
      full_name: 'Test Customer',
      phone: '9876543210',
      house_flat: '101',
      street_area: 'Road',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '000000' // Invalid
    }
  });
  assert('Invalid pincode rejected with HTTP 400', badPinRes.status === 400);

  // Test valid order creation
  const validOrderPayload = {
    items: [
      { product_id: 'p-01', quantity: 1 },
      { product_id: 'p-02', quantity: 1 }
    ],
    customer_details: {
      full_name: 'Direct UPI Customer',
      email: 'direct_upi_test@smartify.in',
      phone: '9876543210'
    },
    shipping_address: {
      full_name: 'Direct UPI Customer',
      phone: '9876543210',
      house_flat: 'Flat 501, Tower C',
      street_area: 'Tech Park Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    }
  };

  let createdOrder = null;
  try {
    const orderRes = await post('/api/payment/create-direct-upi-order', validOrderPayload);
    assert('Valid direct UPI order returns HTTP 201 Created', orderRes.status === 201);
    createdOrder = orderRes.data;

    assert('Response contains order_id and order_number', !!createdOrder.order_id && !!createdOrder.order_number);
    assert('Order status is "Pending Verification"', createdOrder.order_status === 'Pending Verification');
    assert('Payment status is "pending_verification"', createdOrder.payment_status === 'pending_verification');
    assert('Server-calculated amount > 0', typeof createdOrder.amount === 'number' && createdOrder.amount > 0);
    assert(`Direct UPI ID matches configuration (${EXPECTED_UPI_ID})`, createdOrder.direct_upi_id === EXPECTED_UPI_ID);

    // Verify NPCI UPI URI
    const upiUri = createdOrder.upi_uri;
    assert('UPI URI starts with upi://pay?', upiUri && upiUri.startsWith('upi://pay?'));
    assert(`UPI URI contains payee pa=${encodeURIComponent(EXPECTED_UPI_ID)}`, upiUri.includes(encodeURIComponent(EXPECTED_UPI_ID)) || upiUri.includes(EXPECTED_UPI_ID));
    assert(`UPI URI contains payee name pn=${encodeURIComponent(EXPECTED_MERCHANT)}`, upiUri.includes(encodeURIComponent(EXPECTED_MERCHANT)) || upiUri.includes(EXPECTED_MERCHANT));
    assert('UPI URI contains exact amount', upiUri.includes(`am=${createdOrder.amount.toFixed(2)}`));
    assert('UPI URI currency is INR', upiUri.includes('cu=INR'));

    // Verify QR Code Data URL
    const qrData = createdOrder.qr_code_data_url;
    assert('QR Code generated as valid base64 image data URL', qrData && qrData.startsWith('data:image/png;base64,'));
  } catch (err) {
    assert('Order creation test crashed: ' + err.message, false);
  }

  console.log('\n--- SUITE 3: Customer UPI Reference (UTR) Submission ---');
  if (createdOrder) {
    // Test invalid short UTR
    const badUtrRes = await post('/api/payment/submit-upi-reference', {
      order_id: createdOrder.order_id,
      utr_number: '123'
    });
    assert('Short UTR rejected with HTTP 400', badUtrRes.status === 400);

    // Test valid 12-digit UTR submission
    const validUtr = '412389012345';
    const utrRes = await post('/api/payment/submit-upi-reference', {
      order_id: createdOrder.order_id,
      utr_number: validUtr,
      customer_notes: 'Paid via Google Pay'
    });
    assert('Valid UTR submission returns HTTP 200', utrRes.status === 200);
    assert('Returns confirmation that order is pending manual bank verification', utrRes.data.success === true);

    // Verify that order is STILL pending_verification (Never auto-marked paid without manual verification!)
    const checkOrderRes = await get(`/api/orders/${createdOrder.order_id}`);
    assert('Order payment_status is still "pending_verification"', checkOrderRes.data.payment_status === 'pending_verification');
    assert('Order order_status is still "Pending Verification"', checkOrderRes.data.order_status === 'Pending Verification');
    assert('Recorded UTR matches submitted value', checkOrderRes.data.upi_utr === validUtr);
  }

  console.log('\n--- SUITE 4: Admin Manual Verification & Inventory Management ---');
  // First login as admin
  const loginRes = await post('/api/auth/login', {
    email: 'admin@smartify.in',
    password: 'admin123'
  });
  assert('Admin login successful', loginRes.status === 200 && !!loginRes.data.token);
  const adminToken = loginRes.data.token;
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  if (createdOrder && adminToken) {
    // Check initial stock of product p-01
    const p1Before = await get('/api/products/p-01');
    const stockBefore = p1Before.data.product ? p1Before.data.product.stock : p1Before.data.stock;

    // Admin verifies and approves the Direct UPI order
    const verifyRes = await post(`/api/admin/orders/${createdOrder.order_id}/verify-upi`, {
      action: 'approve',
      notes: 'Matched with HDFC Bank statement txn Ref #412389012345'
    }, adminHeaders);

    assert('Admin verify-upi approve returns HTTP 200', verifyRes.status === 200);
    assert('Order payment_status updated to "captured"', verifyRes.data.order.payment_status === 'captured');
    assert('Order order_status updated to "Processing"', verifyRes.data.order.order_status === 'Processing');
    assert('Verified by recorded as Admin', !!verifyRes.data.order.verified_by);

    // Verify inventory deducted
    const p1After = await get('/api/products/p-01');
    const stockAfter = p1After.data.product ? p1After.data.product.stock : p1After.data.stock;
    assert('Inventory stock safely deducted by 1 unit', stockAfter === stockBefore - 1);

    // Test Idempotency: verify again shouldn't deduct stock again
    const verifyAgain = await post(`/api/admin/orders/${createdOrder.order_id}/verify-upi`, {
      action: 'approve'
    }, adminHeaders);
    assert('Idempotent verify returns successfully', verifyAgain.status === 200);
    const p1AfterAgain = await get('/api/products/p-01');
    const stockAfterAgain = p1AfterAgain.data.product ? p1AfterAgain.data.product.stock : p1AfterAgain.data.stock;
    assert('Stock not deducted twice (idempotent)', stockAfterAgain === stockBefore - 1);
  }

  console.log('\n--- SUITE 5: Admin Direct UPI Rejection Flow ---');
  // Create another order to test rejection
  const order2Res = await post('/api/payment/create-direct-upi-order', validOrderPayload);
  if (order2Res.status === 201 && adminToken) {
    const o2Id = order2Res.data.order_id;
    const rejectRes = await post(`/api/admin/orders/${o2Id}/verify-upi`, {
      action: 'reject',
      notes: 'UTR not found in bank statement after 24 hours'
    }, adminHeaders);

    assert('Admin verify-upi reject returns HTTP 200', rejectRes.status === 200);
    assert('Order payment_status updated to "failed"', rejectRes.data.order.payment_status === 'failed');
    assert('Order order_status updated to "Cancelled"', rejectRes.data.order.order_status === 'Cancelled');
  }

  console.log('\n======================================================');
  console.log(`Direct UPI Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDirectUpiTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
