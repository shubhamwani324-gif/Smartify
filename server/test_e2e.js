// server/test_e2e.js
// Comprehensive End-to-End Verification Test Suite for SMARTIFY

const baseUrl = 'http://localhost:5000';

async function runTests() {
  console.log('========================================================');
  console.log('🚀 Running SMARTIFY End-to-End Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check & SPA serving
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    assert(health.status === 'online' && health.currency === 'INR', 'Health check returns online status and INR currency');

    const htmlRes = await fetch(`${baseUrl}/`);
    const htmlText = await htmlRes.text();
    assert(htmlRes.status === 200 && htmlText.includes('SMARTIFY'), 'Root URL serves production React SPA bundle with SMARTIFY title');

    // 2. Catalog & Dynamic Discount Calculation
    const prodsRes = await fetch(`${baseUrl}/api/products?limit=10`).then(r => r.json());
    assert(prodsRes.total >= 30, `Product catalog seeded with ${prodsRes.total} products (>= 30 required)`);

    const p1 = prodsRes.products[0];
    const expectedDiscount = Math.round(((p1.mrp - p1.selling_price) / p1.mrp) * 100);
    assert(p1.discount_percentage === expectedDiscount, `Dynamic discount calculation: MRP ₹${p1.mrp}, Selling ₹${p1.selling_price} -> ${p1.discount_percentage}% OFF`);
    assert(p1.price_source === 'admin', 'Price source tracking properly set to admin');

    // 3. Search & Filters
    const searchRes = await fetch(`${baseUrl}/api/products?search=camera`).then(r => r.json());
    assert(searchRes.products.length > 0 && searchRes.products.some(p => p.product_name.toLowerCase().includes('camera')), 'Instant search by keyword "camera" matches relevant devices');

    const brandRes = await fetch(`${baseUrl}/api/products?brand=Philips`).then(r => r.json());
    assert(brandRes.products.length > 0 && brandRes.products.every(p => p.brand.toLowerCase() === 'philips'), 'Brand filter for "Philips" correctly isolates brand products');

    const dealsRes = await fetch(`${baseUrl}/api/products/deals/highlights`).then(r => r.json());
    assert(dealsRes.under499.length > 0 && dealsRes.under499.every(p => p.selling_price <= 499), 'Deals under ₹499 strictly contains items <= ₹499');
    assert(dealsRes.combos.length > 0 && dealsRes.combos.every(p => p.is_combo === true), 'Deals combo packs isolates curated bundles');

    // 4. Pincode validation
    const pinDelhi = await fetch(`${baseUrl}/api/pincode/check/110001`).then(r => r.json());
    assert(pinDelhi.is_serviceable === true && pinDelhi.city === 'New Delhi', 'Pincode 110001 validates New Delhi delivery');

    // 5. Authentication
    const randomUserEmail = `buyer_${Date.now()}@gmail.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomUserEmail,
        password: 'password123',
        full_name: 'Priya Sharma',
        phone: '9876543210'
      })
    }).then(r => r.json());
    assert(regRes.token && regRes.user.full_name === 'Priya Sharma', 'User registration generates secure JWT token');

    const customerToken = regRes.token;
    const customerId = regRes.user.id;

    // 6. Cart Calculation & Server-side source of truth
    const cartCalc = await fetch(`${baseUrl}/api/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ product_id: p1.id, quantity: 2 }],
        coupon_code: 'WELCOME100'
      })
    }).then(r => r.json());
    assert(cartCalc.subtotal === p1.selling_price * 2, 'Server computes selling subtotal correctly');
    assert(cartCalc.coupon_discount === 100, 'Coupon WELCOME100 subtracts ₹100');
    assert(cartCalc.total === (p1.selling_price * 2 - 100), 'Total matches subtotal minus coupon discount');
    assert(cartCalc.is_free_delivery === true, 'Subtotal > ₹499 grants FREE Delivery');

    // 7. Saved Address
    const addrRes = await fetch(`${baseUrl}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        full_name: 'Priya Sharma',
        phone: '9876543210',
        house_flat: 'Flat 303, Sunrise Greens',
        street_area: 'Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        is_default: true
      })
    }).then(r => r.json());
    assert(addrRes.id && addrRes.pincode === '560034', 'Customer saved Indian delivery address with validation');

    // 8. Razorpay Order Creation
    const rzpOrder = await fetch(`${baseUrl}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        items: [{ product_id: p1.id, quantity: 1 }],
        shipping_address: addrRes,
        coupon_code: 'WELCOME100'
      })
    }).then(r => r.json());
    assert(rzpOrder.order_id && rzpOrder.razorpay_order_id && rzpOrder.currency === 'INR', 'Server created authentic Razorpay order in INR');

    // 9. Payment Signature Verification & Inventory Deduction
    const stockBefore = p1.stock;
    const crypto = require('crypto');
    const e2ePaymentId = 'pay_e2e_live_' + Date.now();
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '9O51MziAzM0PmXGjXkhRcg5m')
      .update(`${rzpOrder.razorpay_order_id}|${e2ePaymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${baseUrl}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        razorpay_order_id: rzpOrder.razorpay_order_id,
        razorpay_payment_id: e2ePaymentId,
        razorpay_signature: validSignature,
        order_id: rzpOrder.order_id
      })
    }).then(r => r.json());
    assert(verifyRes.success === true, 'Server-side payment verification marked order as Paid');

    // Verify stock decreased
    const updatedP1 = await fetch(`${baseUrl}/api/products/${p1.id}`).then(r => r.json());
    assert(updatedP1.product.stock === stockBefore - 1, `Inventory safely deducted from ${stockBefore} to ${updatedP1.product.stock}`);

    // 10. Verified Buyer Review Check
    const reviewEligibility = await fetch(`${baseUrl}/api/reviews/eligibility/${p1.id}`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    }).then(r => r.json());
    assert(reviewEligibility.eligible === true, 'Purchaser verified as eligible to submit review');

    const reviewRes = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        product_id: p1.id,
        rating: 5,
        comment: 'Super fast delivery and seamless connection with Alexa!'
      })
    }).then(r => r.json());
    assert(reviewRes.review && reviewRes.review.verified_purchase === true, 'Verified buyer review posted and recorded');

    // 11. Admin Control & Price Audit Trail
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gharva.in', password: 'admin123' })
    }).then(r => r.json());
    assert(adminLogin.user.role === 'admin', 'Admin logged in with elevated permissions');

    const adminToken = adminLogin.token;

    // Update Price with audit logging
    const priceUpdateRes = await fetch(`${baseUrl}/api/admin/products/${p1.id}/price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        mrp: p1.mrp,
        selling_price: p1.selling_price - 50,
        price_source: 'admin'
      })
    }).then(r => r.json());
    assert(priceUpdateRes.product.selling_price === p1.selling_price - 50, 'Admin changed price');

    const auditRes = await fetch(`${baseUrl}/api/admin/price-history?product_id=${p1.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }).then(r => r.json());
    assert(auditRes.length > 0 && auditRes[0].new_price === p1.selling_price - 50, 'Price change permanently audited in price_history');

    // 12. CSV Bulk Import
    const csvData = `brand,product_name,model,category,mrp,selling_price,stock,description,image_url,sku\nSyska,Syska Smart Strip 3m,SSK-3M,smart-lighting,1999,999,30,RGB 3m light strip,https://images.unsplash.com/photo-1540932239986-30128078f3c5,SYS-CSV-01`;
    const csvImportRes = await fetch(`${baseUrl}/api/admin/csv-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ csv_data: csvData, preview_only: false })
    }).then(r => r.json());
    assert(csvImportRes.imported_count === 1, 'CSV bulk import successfully validated and inserted product');

    console.log('\n========================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
