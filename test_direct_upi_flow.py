# test_direct_upi_flow.py
# Comprehensive Unit and Integration Test Suite for SMARTIFY Direct UPI Payment (8468990113@ibl)
import unittest
import json
import base64
import io
import urllib.parse
from PIL import Image

# Import Flask app and helpers
from app import app, get_db, save_db, get_order_by_id, get_product_by_id, JWT_SECRET
import jwt

class TestSmartifyDirectUpiFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.app = app

        # Generate admin JWT token
        cls.admin_token = jwt.encode(
            {'id': 'admin-01', 'email': 'admin@smartify.in', 'role': 'admin'},
            JWT_SECRET,
            algorithm='HS256'
        )

        # Generate customer JWT token
        cls.customer_token = jwt.encode(
            {'id': 'cust-01', 'email': 'customer@smartify.in', 'role': 'customer'},
            JWT_SECRET,
            algorithm='HS256'
        )

    def test_01_payment_config_returns_direct_upi(self):
        """1. Verify payment config endpoint returns direct_upi and 8468990113@ibl"""
        res = self.client.get('/api/payment/config')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('payment_method'), 'direct_upi')
        self.assertEqual(data.get('upi_id'), '8468990113@ibl')
        self.assertEqual(data.get('merchant_name'), 'SMARTIFY')
        self.assertEqual(data.get('has_automated_verification'), False)

    def _create_order(self):
        prod = get_product_by_id('p-01')
        initial_stock = prod['stock']

        order_payload = {
            'items': [{'product_id': 'p-01', 'quantity': 1}],
            'customer_details': {
                'full_name': 'Test Buyer',
                'phone': '9876543210',
                'email': 'buyer@smartify.in'
            },
            'shipping_address': {
                'full_name': 'Test Buyer',
                'phone': '9876543210',
                'house_flat': 'Flat 101, Smart Tower',
                'street_area': 'Connaught Place',
                'city': 'New Delhi',
                'state': 'Delhi',
                'pincode': '110001'
            }
        }

        res = self.client.post('/api/payment/create-upi-order', json=order_payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        expected_total = prod['selling_price'] + (0 if prod['selling_price'] >= 499 else 49)
        return data, expected_total, initial_stock

    def test_02_create_upi_order_pending_and_exact_amount(self):
        """2. Verify order creation sets status PENDING, exact INR amount, and does NOT deduct stock"""
        data, expected_total, initial_stock = self._create_order()

        self.assertIn('order_id', data)
        self.assertIn('order_number', data)
        self.assertEqual(data['payment_status'], 'pending')
        self.assertEqual(data['upi_id'], '8468990113@ibl')
        self.assertEqual(data['amount'], expected_total)

        # Check UPI Link format
        upi_link = data.get('upi_link', '')
        self.assertTrue(upi_link.startswith('upi://pay?'))
        self.assertIn('pa=8468990113@ibl', upi_link)
        self.assertIn(f"am={expected_total:.2f}", upi_link)
        self.assertIn('cu=INR', upi_link)
        self.assertIn(f"tr={data['order_id']}", upi_link)

        # Check that scannable QR code data URL is returned
        qr_code = data.get('qr_code', '')
        self.assertTrue(qr_code.startswith('data:image/png;base64,'))

        # Check stock is NOT deducted on order creation!
        prod_after = get_product_by_id('p-01')
        self.assertEqual(prod_after['stock'], initial_stock, "Stock should NOT be deducted when order is created as PENDING")

        # Verify raw QR endpoint
        qr_res = self.client.get(f"/api/payment/upi-qr/{data['order_id']}")
        self.assertEqual(qr_res.status_code, 200)
        self.assertEqual(qr_res.content_type, 'image/png')
        self.assertGreater(len(qr_res.data), 100)

        # Verify image is a valid PNG using PIL
        img = Image.open(io.BytesIO(qr_res.data))
        self.assertEqual(img.format, 'PNG')

    def test_03_submit_utr_reference(self):
        """3. Verify submitting customer UTR updates status to pending_verification and does not mark paid"""
        order_data, total, _ = self._create_order()
        order_id = order_data['order_id']

        utr_res = self.client.post('/api/payment/submit-upi-reference', json={
            'order_id': order_id,
            'utr': '408239129841'
        })
        self.assertEqual(utr_res.status_code, 200)
        data = utr_res.get_json()
        self.assertEqual(data.get('success'), True)
        self.assertEqual(data.get('payment_status'), 'pending_verification')
        self.assertIn('Payment verification pending. Please wait for confirmation.', data.get('message'))

        # Check status endpoint
        status_res = self.client.get(f'/api/payment/status/{order_id}')
        self.assertEqual(status_res.status_code, 200)
        sdata = status_res.get_json()
        self.assertEqual(sdata.get('payment_status'), 'pending_verification')
        self.assertEqual(sdata.get('is_paid'), False)
        self.assertEqual(sdata.get('is_pending'), True)
        self.assertEqual(sdata.get('upi_utr'), '408239129841')

    def test_04_admin_verification_security_checks(self):
        """4. Verify admin verification requires admin authorization and validates exact amount"""
        order_data, total, _ = self._create_order()
        order_id = order_data['order_id']

        # A: Unauthorized request (no token) -> 403
        no_auth = self.client.post(f'/api/admin/orders/{order_id}/verify-upi', json={'action': 'approve'})
        self.assertEqual(no_auth.status_code, 403)

        # B: Customer token (non-admin) -> 403
        cust_auth = self.client.post(
            f'/api/admin/orders/{order_id}/verify-upi',
            headers={'Authorization': f'Bearer {self.customer_token}'},
            json={'action': 'approve'}
        )
        self.assertEqual(cust_auth.status_code, 403)

        # C: Admin token with incorrect amount -> 400
        wrong_amt = self.client.post(
            f'/api/admin/orders/{order_id}/verify-upi',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve', 'verified_amount': total + 100}
        )
        self.assertEqual(wrong_amt.status_code, 400)
        self.assertIn('Amount mismatch', wrong_amt.get_json().get('error', ''))

    def test_05_admin_approval_confirms_paid_and_deducts_stock(self):
        """5. Verify genuine admin approval marks order captured/paid and deducts stock"""
        order_data, total, initial_stock = self._create_order()
        order_id = order_data['order_id']

        approve_res = self.client.post(
            f'/api/admin/orders/{order_id}/verify-upi',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={
                'action': 'approve',
                'verified_amount': total,
                'bank_reference': 'UTR408239129841'
            }
        )
        self.assertEqual(approve_res.status_code, 200)
        data = approve_res.get_json()
        self.assertEqual(data.get('success'), True)
        self.assertEqual(data.get('order', {}).get('payment_status'), 'captured')
        self.assertEqual(data.get('order', {}).get('order_status'), 'Processing')
        self.assertEqual(data.get('order', {}).get('verified_by'), 'admin@smartify.in')

        # Check status endpoint now reports is_paid == True
        status_res = self.client.get(f'/api/payment/status/{order_id}')
        sdata = status_res.get_json()
        self.assertEqual(sdata.get('is_paid'), True)
        self.assertEqual(sdata.get('payment_status'), 'captured')

        # Check inventory is safely deducted by exactly 1
        prod_after = get_product_by_id('p-01')
        self.assertEqual(prod_after['stock'], initial_stock - 1, "Stock should be decremented after genuine admin confirmation")

        # Test IDEMPOTENCY: second approval must NOT re-deduct stock!
        dup_res = self.client.post(
            f'/api/admin/orders/{order_id}/verify-upi',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={'action': 'approve', 'verified_amount': total}
        )
        self.assertEqual(dup_res.status_code, 200)
        prod_after_dup = get_product_by_id('p-01')
        self.assertEqual(prod_after_dup['stock'], initial_stock - 1, "Duplicate confirmation MUST NOT deduct stock again")

    def test_06_admin_rejection_marks_failed_and_preserves_stock(self):
        """6. Verify admin rejection marks order failed and preserves stock"""
        order_data, total, initial_stock = self._create_order()
        order_id = order_data['order_id']

        reject_res = self.client.post(
            f'/api/admin/orders/{order_id}/verify-upi',
            headers={'Authorization': f'Bearer {self.admin_token}'},
            json={
                'action': 'reject',
                'reason': 'Payment not received in bank account within 2 hours.'
            }
        )
        self.assertEqual(reject_res.status_code, 200)
        data = reject_res.get_json()
        self.assertEqual(data.get('success'), True)
        self.assertEqual(data.get('order', {}).get('payment_status'), 'failed')
        self.assertEqual(data.get('order', {}).get('order_status'), 'Cancelled')

        # Stock remains untouched
        prod = get_product_by_id('p-01')
        self.assertEqual(prod['stock'], initial_stock, "Stock should not be deducted on rejected orders")

if __name__ == '__main__':
    unittest.main()
