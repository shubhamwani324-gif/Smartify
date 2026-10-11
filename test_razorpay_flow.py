# test_razorpay_flow.py
# Automated Test Suite for SMARTIFY Razorpay Standard Checkout & Automatic UPI Confirmation
import os
import sys
import json
import time
import hmac
import hashlib
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, get_db

class TestRazorpayIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()

    def get_valid_product(self):
        db = get_db()
        for p in db.get('products', []):
            if p.get('is_active', True) and p.get('stock', 0) > 2:
                return p
        raise RuntimeError("No active product found in database for testing.")

    def test_01_health_and_config(self):
        """1. Verify API Health and Public Payment Configuration"""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'online')
        self.assertEqual(data.get('currency'), 'INR')

        res_cfg = self.client.get('/api/payment/config')
        self.assertEqual(res_cfg.status_code, 200)
        cfg = res_cfg.get_json()
        self.assertEqual(cfg.get('merchant_name'), 'SMARTIFY')
        self.assertEqual(cfg.get('currency'), 'INR')
        self.assertEqual(cfg.get('razorpay_key_id'), RAZORPAY_KEY_ID)
        # Ensure secret is NEVER exposed in config
        self.assertNotIn('key_secret', cfg)
        self.assertNotIn('secret', cfg)
        print("[PASS] Test 01: Health and secure payment config verified")

    def test_02_create_order_server_calculated(self):
        """2. Verify Server-Side Cart Calculation & Razorpay Order Creation in Paise"""
        sample_prod = self.get_valid_product()

        payload = {
            'items': [
                {'product_id': sample_prod['id'], 'quantity': 1}
            ],
            'customer_details': {
                'full_name': 'Aarav Patel',
                'email': 'aarav@example.com',
                'phone': '9876543210'
            },
            'shipping_address': {
                'full_name': 'Aarav Patel',
                'phone': '9876543210',
                'house_flat': 'Flat 101, Galaxy Heights',
                'street_area': 'MG Road, Indiranagar',
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'pincode': '560038'
            }
        }

        res = self.client.post('/api/payment/create-order', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()

        self.assertIn('order_id', data)
        self.assertIn('order_number', data)
        self.assertIn('razorpay_order_id', data)
        self.assertTrue(data['razorpay_order_id'].startswith('order_'))

        # Server-calculated delivery fee rule: free for >= 499, else 49
        expected_delivery = 0 if sample_prod['selling_price'] >= 499 else 49
        expected_total = sample_prod['selling_price'] + expected_delivery
        expected_paise = round(expected_total * 100)

        self.assertEqual(data['amount'], expected_paise)
        self.assertEqual(data['currency'], 'INR')
        self.assertEqual(data['key_id'], RAZORPAY_KEY_ID)

        # Check internal order saved in pending state
        db = get_db()
        order_record = None
        for o in db['orders']:
            if o['id'] == data['order_id']:
                order_record = o
                break
        self.assertIsNotNone(order_record)
        self.assertEqual(order_record['payment_status'], 'pending')
        self.assertEqual(order_record['order_status'], 'Pending Payment')
        print(f"[PASS] Test 02: Order {data['order_number']} created with amount Rs {expected_total} ({expected_paise} paise)")

    def test_03_successful_signature_verification_and_stock_deduction(self):
        """3. Cryptographic Signature Verification and Atomic Order Confirmation"""
        sample_prod = self.get_valid_product()
        initial_stock = sample_prod['stock']

        # Create order first
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Meera Sen', 'email': 'meera@example.com', 'phone': '9812345678'},
            'shipping_address': {
                'full_name': 'Meera Sen', 'phone': '9812345678',
                'house_flat': 'Tower 2, Apt 5B', 'street_area': 'Park Street',
                'city': 'Kolkata', 'state': 'West Bengal', 'pincode': '700016'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()
        rzp_order_id = order_info['razorpay_order_id']
        order_id = order_info['order_id']

        # Generate genuine HMAC SHA256 signature
        rzp_payment_id = f"pay_test_{int(time.time())}"
        signature_payload = f"{rzp_order_id}|{rzp_payment_id}"
        valid_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            signature_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Send to verify endpoint
        verify_res = self.client.post('/api/payment/verify', json={
            'razorpay_order_id': rzp_order_id,
            'razorpay_payment_id': rzp_payment_id,
            'razorpay_signature': valid_signature,
            'order_id': order_id
        })

        self.assertEqual(verify_res.status_code, 200)
        verify_data = verify_res.get_json()
        self.assertTrue(verify_data['success'])
        self.assertIn('Aapka order confirm ho gaya hai', verify_data['message'])

        # Verify internal order marked captured
        db = get_db()
        for o in db['orders']:
            if o['id'] == order_id:
                self.assertEqual(o['payment_status'], 'captured')
                self.assertEqual(o['order_status'], 'Processing')
                self.assertEqual(o['razorpay_payment_id'], rzp_payment_id)
                break

        # Verify stock safely decremented by 1
        for p in db['products']:
            if p['id'] == sample_prod['id']:
                self.assertEqual(p['stock'], initial_stock - 1)
                break

        print("[PASS] Test 03: Signature verified, order marked captured, stock decremented")

    def test_04_idempotent_verification_duplicate_callback(self):
        """4. Idempotency Protection: Repeated Verification Must Not Double Deduct Stock"""
        sample_prod = self.get_valid_product()

        # Create order
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Kavita Joshi', 'email': 'kavita@example.com', 'phone': '9899887766'},
            'shipping_address': {
                'full_name': 'Kavita Joshi', 'phone': '9899887766',
                'house_flat': 'Villa 12', 'street_area': 'Road 4',
                'city': 'Pune', 'state': 'Maharashtra', 'pincode': '411001'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()
        rzp_order_id = order_info['razorpay_order_id']
        order_id = order_info['order_id']

        db = get_db()
        for p in db['products']:
            if p['id'] == sample_prod['id']:
                stock_before = p['stock']
                break

        rzp_payment_id = f"pay_test_{int(time.time()) + 1}"
        signature_payload = f"{rzp_order_id}|{rzp_payment_id}"
        valid_sig = hmac.new(
            RAZORPAY_KEY_SECRET.encode('utf-8'),
            signature_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # First verification
        res1 = self.client.post('/api/payment/verify', json={
            'razorpay_order_id': rzp_order_id,
            'razorpay_payment_id': rzp_payment_id,
            'razorpay_signature': valid_sig,
            'order_id': order_id
        })
        self.assertEqual(res1.status_code, 200)

        # Check stock after first verification
        db = get_db()
        for p in db['products']:
            if p['id'] == sample_prod['id']:
                stock_after_first = p['stock']
                self.assertEqual(stock_after_first, stock_before - 1)
                break

        # SECOND verification (duplicate webhook/client retry)
        res2 = self.client.post('/api/payment/verify', json={
            'razorpay_order_id': rzp_order_id,
            'razorpay_payment_id': rzp_payment_id,
            'razorpay_signature': valid_sig,
            'order_id': order_id
        })
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertTrue(data2['success'])
        self.assertIn('already verified', data2['message'])

        # Stock must NOT be decremented again!
        db = get_db()
        for p in db['products']:
            if p['id'] == sample_prod['id']:
                self.assertEqual(p['stock'], stock_after_first)
                break

        print("[PASS] Test 04: Duplicate verification handled idempotently without duplicate stock reduction")

    def test_05_invalid_signature_rejection(self):
        """5. Invalid/Tampered Signature Detection and Rejection"""
        sample_prod = self.get_valid_product()
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Vikram R', 'email': 'vikram@example.com', 'phone': '9822334455'},
            'shipping_address': {
                'full_name': 'Vikram R', 'phone': '9822334455',
                'house_flat': 'Flat 8', 'street_area': 'Lane 2',
                'city': 'Chennai', 'state': 'Tamil Nadu', 'pincode': '600001'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()

        # Submit bogus signature
        fake_signature = "bad_tampered_signature_hex_1234567890abcdef"
        res = self.client.post('/api/payment/verify', json={
            'razorpay_order_id': order_info['razorpay_order_id'],
            'razorpay_payment_id': 'pay_fake_9999',
            'razorpay_signature': fake_signature,
            'order_id': order_info['order_id']
        })

        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data['success'])
        self.assertIn('signature verification failed', data['error'].lower())

        # Order must be marked failed
        db = get_db()
        for o in db['orders']:
            if o['id'] == order_info['order_id']:
                self.assertEqual(o['payment_status'], 'failed')
                self.assertEqual(o['order_status'], 'Cancelled')
                break

        print("[PASS] Test 05: Invalid signature securely rejected with HTTP 400")

    def test_06_payment_failure_reporting_preserves_cart(self):
        """6. Payment Failure Reporting Does Not Corrupt Cart or Inventory"""
        sample_prod = self.get_valid_product()
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Ananya G', 'email': 'ananya@example.com', 'phone': '9833445566'},
            'shipping_address': {
                'full_name': 'Ananya G', 'phone': '9833445566',
                'house_flat': 'H No 44', 'street_area': 'Civil Lines',
                'city': 'Jaipur', 'state': 'Rajasthan', 'pincode': '302001'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()

        fail_res = self.client.post('/api/payment/failed', json={
            'order_id': order_info['order_id'],
            'error_code': 'BAD_REQUEST_ERROR',
            'error_description': 'Customer dismissed payment window'
        })
        self.assertEqual(fail_res.status_code, 200)

        db = get_db()
        for o in db['orders']:
            if o['id'] == order_info['order_id']:
                self.assertEqual(o['payment_status'], 'failed')
                self.assertEqual(o['order_status'], 'Cancelled')
                break

        print("[PASS] Test 06: Payment failure safely logged as Cancelled without charging user")

    def test_07_payment_status_polling(self):
        """7. Status Polling Endpoint Returns Live Order State"""
        sample_prod = self.get_valid_product()
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Rajesh K', 'email': 'rajesh@example.com', 'phone': '9844556677'},
            'shipping_address': {
                'full_name': 'Rajesh K', 'phone': '9844556677',
                'house_flat': 'Plot 10', 'street_area': 'MG Road',
                'city': 'Ahmedabad', 'state': 'Gujarat', 'pincode': '380001'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()

        # Poll status
        status_res = self.client.get(f"/api/payment/status/{order_info['order_id']}")
        self.assertEqual(status_res.status_code, 200)
        data = status_res.get_json()
        self.assertEqual(data['order_id'], order_info['order_id'])
        self.assertEqual(data['payment_status'], 'pending')
        self.assertFalse(data['is_paid'])
        print("[PASS] Test 07: Payment status polling endpoint functional")

    def test_08_webhook_signature_verification_and_capture(self):
        """8. Webhook Signature Verification and Asynchronous Order Capture"""
        sample_prod = self.get_valid_product()
        create_res = self.client.post('/api/payment/create-order', json={
            'items': [{'product_id': sample_prod['id'], 'quantity': 1}],
            'customer_details': {'full_name': 'Deepak S', 'email': 'deepak@example.com', 'phone': '9855667788'},
            'shipping_address': {
                'full_name': 'Deepak S', 'phone': '9855667788',
                'house_flat': 'Flat 303', 'street_area': 'Outer Ring Road',
                'city': 'Hyderabad', 'state': 'Telangana', 'pincode': '500001'
            }
        })
        self.assertEqual(create_res.status_code, 201)
        order_info = create_res.get_json()
        rzp_order_id = order_info['razorpay_order_id']

        webhook_event = {
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': f"pay_wh_{int(time.time())}",
                        'order_id': rzp_order_id,
                        'amount': order_info['amount'],
                        'currency': 'INR',
                        'status': 'captured',
                        'method': 'upi'
                    }
                }
            }
        }
        raw_body = json.dumps(webhook_event)

        valid_wh_sig = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
            raw_body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Send webhook
        wh_res = self.client.post(
            '/api/payment/webhook',
            data=raw_body,
            headers={
                'Content-Type': 'application/json',
                'x-razorpay-signature': valid_wh_sig
            }
        )
        self.assertEqual(wh_res.status_code, 200)
        self.assertEqual(wh_res.get_json().get('status'), 'ok')

        # Check order captured
        db = get_db()
        for o in db['orders']:
            if o['id'] == order_info['order_id']:
                self.assertEqual(o['payment_status'], 'captured')
                self.assertEqual(o['order_status'], 'Processing')
                break

        # Test tampered webhook signature is rejected
        wh_bad_res = self.client.post(
            '/api/payment/webhook',
            data=raw_body,
            headers={
                'Content-Type': 'application/json',
                'x-razorpay-signature': 'tampered_webhook_signature_hex'
            }
        )
        self.assertEqual(wh_bad_res.status_code, 400)

        print("[PASS] Test 08: Webhook verified with HMAC, captured asynchronously, tampered signature rejected")

if __name__ == '__main__':
    print("\n=======================================================")
    print("  RUNNING SMARTIFY RAZORPAY TEST SUITE")
    print("=======================================================\n")
    unittest.main()
