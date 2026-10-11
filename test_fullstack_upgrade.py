# test_fullstack_upgrade.py
# SMARTIFY Full-Stack Upgrade Test Suite
# Tests: Address Management, Google Auth, Phone OTP, Razorpay Flow, and Authorization Security
import unittest
import json
import time
import hmac
import hashlib
import jwt
from app import app, get_db, save_db, JWT_SECRET, otp_store, normalize_indian_phone

class SmartifyFullStackUpgradeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()

        # Seed two test users for ownership and authorization tests
        db = get_db()
        cls.user1_id = "test-user-alpha"
        cls.user2_id = "test-user-beta"

        # User 1 (Alpha)
        user1 = {
            'id': cls.user1_id,
            'email': 'alpha@example.com',
            'full_name': 'Alpha Customer',
            'phone': '9876543210',
            'role': 'customer',
            'created_at': '2026-10-11T00:00:00Z'
        }
        # User 2 (Beta)
        user2 = {
            'id': cls.user2_id,
            'email': 'beta@example.com',
            'full_name': 'Beta Customer',
            'phone': '9811223344',
            'role': 'customer',
            'created_at': '2026-10-11T00:00:00Z'
        }

        # Remove previous test users if any
        db['users'] = [u for u in db.get('users', []) if u.get('id') not in [cls.user1_id, cls.user2_id]]
        db['users'].extend([user1, user2])

        # Generate JWT tokens
        cls.token1 = jwt.encode({'id': cls.user1_id, 'email': user1['email'], 'role': 'customer'}, JWT_SECRET, algorithm='HS256')
        cls.token2 = jwt.encode({'id': cls.user2_id, 'email': user2['email'], 'role': 'customer'}, JWT_SECRET, algorithm='HS256')

        save_db()

    # ========================================================
    # 1. PHONE NUMBER NORMALIZATION & OTP AUTH TESTS (PHASE 4)
    # ========================================================

    def test_01_phone_normalization(self):
        """Verify Indian phone normalization (+91, leading 0, 10 digits)."""
        self.assertEqual(normalize_indian_phone('9876543210'), '9876543210')
        self.assertEqual(normalize_indian_phone('+91 9876543210'), '9876543210')
        self.assertEqual(normalize_indian_phone('919876543210'), '9876543210')
        self.assertEqual(normalize_indian_phone('09876543210'), '9876543210')
        # Invalid numbers
        self.assertIsNone(normalize_indian_phone('12345'))
        self.assertIsNone(normalize_indian_phone('5876543210')) # Starts with 5 (invalid Indian mobile)
        self.assertIsNone(normalize_indian_phone('abcdefghij'))
        print("\n[PASS] Phone normalization verified for Indian format.")

    def test_02_otp_send_and_hashed_storage(self):
        """Verify OTP sending, 60s cooldown, and cryptographic salt-hashed storage (never plaintext)."""
        phone = '9876500001'
        # Reset any previous record in store
        if phone in otp_store:
            del otp_store[phone]

        # Step 1: Send OTP
        res = self.client.post('/api/auth/otp/send', json={'phone': phone})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('cooldown_seconds'), 60)

        # Step 2: Verify in-memory record is salt-hashed, NOT plaintext
        rec = otp_store.get(phone)
        self.assertIsNotNone(rec)
        self.assertIn('otp_hash', rec)
        self.assertIn('salt', rec)
        self.assertNotIn('otp', rec) # Plaintext OTP MUST NOT be stored!
        self.assertEqual(len(rec['otp_hash']), 64) # SHA-256 hex string

        # Step 3: Verify 60s cooldown immediately blocks subsequent requests
        res_cooldown = self.client.post('/api/auth/otp/send', json={'phone': phone})
        self.assertEqual(res_cooldown.status_code, 429)
        self.assertIn('Please wait', res_cooldown.get_json().get('error', ''))
        print("[PASS] OTP dispatched, cryptographic hashed storage verified, 60s cooldown enforced.")

    def test_03_otp_verification_attempt_limit_and_success(self):
        """Verify incorrect OTP attempt limits (max 5) and successful verification with session JWT."""
        phone = '9876500002'
        if phone in otp_store:
            del otp_store[phone]

        # Send OTP
        res_send = self.client.post('/api/auth/otp/send', json={'phone': phone})
        self.assertEqual(res_send.status_code, 200)
        demo_otp = res_send.get_json().get('dev_otp')
        self.assertIsNotNone(demo_otp)

        # Attempt with wrong OTP
        res_wrong = self.client.post('/api/auth/otp/verify', json={'phone': phone, 'otp': '000000'})
        self.assertEqual(res_wrong.status_code, 400)
        self.assertIn('attempt(s) remaining', res_wrong.get_json().get('error', ''))

        # Verify attempts incremented in secure store
        self.assertEqual(otp_store[phone]['attempts'], 1)

        # Now verify with correct OTP
        res_correct = self.client.post('/api/auth/otp/verify', json={
            'phone': phone,
            'otp': demo_otp,
            'full_name': 'OTP Verified User'
        })
        self.assertEqual(res_correct.status_code, 200)
        data = res_correct.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['phone'], phone)

        # Verify used OTP was removed from store
        self.assertNotIn(phone, otp_store)
        print("[PASS] OTP incorrect attempt counter and successful JWT login verified.")

    # ========================================================
    # 2. GOOGLE OAUTH SECURITY TESTS (PHASE 3)
    # ========================================================

    def test_04_google_auth_config_and_validation(self):
        """Verify Google OAuth config endpoint and missing/invalid token rejection."""
        # Config check
        res_cfg = self.client.get('/api/auth/google/config')
        self.assertEqual(res_cfg.status_code, 200)
        cfg_data = res_cfg.get_json()
        self.assertIn('enabled', cfg_data)
        self.assertIn('client_id', cfg_data)

        # Missing token rejection
        res_bad = self.client.post('/api/auth/google/verify', json={'credential': ''})
        # If client_id is not set, returns 503; if set, returns 400 for empty token
        self.assertIn(res_bad.status_code, [400, 503])
        print("[PASS] Google OAuth config endpoint and input validation verified.")

    # ========================================================
    # 3. DELIVERY ADDRESS MANAGEMENT & OWNERSHIP (PHASE 2)
    # ========================================================

    def test_05_address_creation_and_validation(self):
        """Verify delivery address creation with PIN code and mobile validation."""
        headers = {'Authorization': f'Bearer {self.token1}'}

        # Invalid PIN (not 6 digits)
        bad_pin = {
            'full_name': 'Alpha Tester',
            'phone': '9876543210',
            'house_flat': 'Flat 101',
            'pincode': '123'
        }
        res_bad_pin = self.client.post('/api/addresses', headers=headers, json=bad_pin)
        self.assertEqual(res_bad_pin.status_code, 400)
        self.assertIn('6-digit', res_bad_pin.get_json().get('error', ''))

        # Valid Address
        valid_addr = {
            'tag': 'Home',
            'full_name': 'Alpha Customer',
            'phone': '9876543210',
            'house_flat': 'Flat 402, Sunshine Heights',
            'street_area': 'MG Road',
            'locality': 'Indiranagar',
            'city': 'Bengaluru',
            'state': 'Karnataka',
            'pincode': '560038',
            'delivery_instructions': 'Leave at door',
            'is_default': True
        }
        res_valid = self.client.post('/api/addresses', headers=headers, json=valid_addr)
        self.assertEqual(res_valid.status_code, 201)
        created = res_valid.get_json()
        self.assertEqual(created['user_id'], self.user1_id)
        self.assertEqual(created['pincode'], '560038')
        self.assertTrue(created['is_default'])
        self.addr1_id = created['id']
        print("[PASS] Address validation and creation for authenticated user verified.")

    def test_06_address_cross_user_ownership_enforcement(self):
        """CRITICAL: Verify User B cannot view, modify, or delete User A's address."""
        headers_user1 = {'Authorization': f'Bearer {self.token1}'}
        headers_user2 = {'Authorization': f'Bearer {self.token2}'}

        # 1. User 1 creates an address
        res_add = self.client.post('/api/addresses', headers=headers_user1, json={
            'tag': 'Work',
            'full_name': 'Alpha Work',
            'phone': '9876543210',
            'house_flat': 'Cyber City Tower A',
            'pincode': '122002'
        })
        self.assertEqual(res_add.status_code, 201)
        addr_id = res_add.get_json()['id']

        # 2. User 2 requests their address list -> User 1's address must NOT be present
        res_list2 = self.client.get('/api/addresses', headers=headers_user2)
        self.assertEqual(res_list2.status_code, 200)
        user2_addr_ids = [a['id'] for a in res_list2.get_json()]
        self.assertNotIn(addr_id, user2_addr_ids)

        # 3. User 2 tries to maliciously modify User 1's address -> MUST be 403 Forbidden
        res_tamper = self.client.put(f'/api/addresses/{addr_id}', headers=headers_user2, json={
            'house_flat': 'Hacked Address'
        })
        self.assertEqual(res_tamper.status_code, 403)
        self.assertIn('Unauthorized', res_tamper.get_json().get('error', ''))

        # 4. User 2 tries to maliciously delete User 1's address -> MUST be 403 Forbidden
        res_del_tamper = self.client.delete(f'/api/addresses/{addr_id}', headers=headers_user2)
        self.assertEqual(res_del_tamper.status_code, 403)

        # 5. User 1 deletes their own address -> 200 OK
        res_del_own = self.client.delete(f'/api/addresses/{addr_id}', headers=headers_user1)
        self.assertEqual(res_del_own.status_code, 200)
        print("[PASS] Strict cross-user address privacy & ownership enforcement verified (HTTP 403 on tampering).")

    # ========================================================
    # 4. RAZORPAY PAYMENT FLOW & IDEMPOTENCY (PHASE 5)
    # ========================================================

    def test_07_razorpay_order_creation_and_signature(self):
        """Verify server-side Razorpay order calculation, HMAC SHA-256 signature, and idempotency."""
        headers = {'Authorization': f'Bearer {self.token1}'}
        db = get_db()
        prod = next(p for p in db['products'] if p.get('is_active', True) and p.get('stock', 0) > 0)

        order_payload = {
            'items': [{'product_id': prod['id'], 'quantity': 1}],
            'customer_details': {
                'full_name': 'Alpha Customer',
                'email': 'alpha@example.com',
                'phone': '9876543210'
            },
            'shipping_address': {
                'full_name': 'Alpha Customer',
                'phone': '9876543210',
                'house_flat': 'Flat 402, Sunshine Heights',
                'street_area': 'MG Road',
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'pincode': '560038'
            }
        }

        # Step 1: Create Order
        res_order = self.client.post('/api/payment/create-order', headers=headers, json=order_payload)
        self.assertEqual(res_order.status_code, 201)
        order_data = res_order.get_json()
        self.assertIn('razorpay_order_id', order_data)
        self.assertIn('order_id', order_data)

        # Step 2: Compute valid HMAC SHA-256 signature
        rzp_order_id = order_data['razorpay_order_id']
        rzp_payment_id = "pay_test_upgraded_12345"
        key_secret = "9O51MziAzM0PmXGjXkhRcg5m"

        body_str = f"{rzp_order_id}|{rzp_payment_id}"
        sig = hmac.new(key_secret.encode('utf-8'), body_str.encode('utf-8'), hashlib.sha256).hexdigest()

        # Step 3: Verify Payment
        res_verify = self.client.post('/api/payment/verify', headers=headers, json={
            'order_id': order_data['order_id'],
            'razorpay_order_id': rzp_order_id,
            'razorpay_payment_id': rzp_payment_id,
            'razorpay_signature': sig
        })
        self.assertEqual(res_verify.status_code, 200)
        self.assertTrue(res_verify.get_json()['success'])

        # Step 4: Idempotency - duplicate verification must succeed without error
        res_dup = self.client.post('/api/payment/verify', headers=headers, json={
            'order_id': order_data['order_id'],
            'razorpay_order_id': rzp_order_id,
            'razorpay_payment_id': rzp_payment_id,
            'razorpay_signature': sig
        })
        self.assertEqual(res_dup.status_code, 200)
        self.assertTrue(res_dup.get_json()['success'])
        print("[PASS] Razorpay order creation, cryptographic HMAC verification, and idempotency verified.")

if __name__ == '__main__':
    unittest.main()
