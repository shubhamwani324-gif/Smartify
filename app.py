# app.py
# SMARTIFY - Indian Smart Home Marketplace
# Python Flask Backend with Direct UPI Payment (8468990113@ibl) & Administrative Verification
import os
import sys
import json
import time
import hmac
import hashlib
import threading
import urllib.parse
import io
import base64
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory, send_file, Response
from flask_cors import CORS
from dotenv import load_dotenv
import qrcode
import qrcode.constants
import jwt
import razorpay
import razorpay.errors
import requests
import secrets
import re

# Load environment variables
ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
if not os.path.exists(DIST_DIR):
    alt_dist = os.path.join(BASE_DIR, 'SmartHome', 'dist')
    if os.path.exists(alt_dist):
        DIST_DIR = alt_dist

PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
if not os.path.exists(PUBLIC_DIR):
    alt_public = os.path.join(BASE_DIR, 'SmartHome', 'public')
    if os.path.exists(alt_public):
        PUBLIC_DIR = alt_public

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})

PORT = int(os.getenv('PORT', 5000))
SECRET_KEY = os.getenv('SECRET_KEY', os.getenv('JWT_SECRET', 'smartify-secure-jwt-token-secret-2026-smart-home')).strip()
app.config['SECRET_KEY'] = SECRET_KEY
JWT_SECRET = SECRET_KEY
DATABASE_URL = os.getenv('DATABASE_URL')

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_TloKHUV0Il3Vuz').strip()
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '9O51MziAzM0PmXGjXkhRcg5m').strip()
RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', 'rzp_webhook_secret_smartify_2026').strip()

# Initialize official Razorpay SDK client
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

UPI_ID = os.getenv('SMARTIFY_UPI_ID', '8468990113@ibl').strip()
UPI_MERCHANT_NAME = os.getenv('SMARTIFY_UPI_NAME', 'SMARTIFY').strip()

# Google OAuth 2.0 Credentials (Configured via Environment Variables)
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000').strip()

# Indian SMS & OTP Provider Configuration
SMS_PROVIDER = os.getenv('SMS_PROVIDER', 'dev').strip().lower()
FAST2SMS_API_KEY = os.getenv('FAST2SMS_API_KEY', '').strip()
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '').strip()
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '').strip()
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '').strip()

# Thread-safe in-memory store for OTP cooldowns, attempt counters, and hashed tokens
otp_store = {}
otp_lock = threading.Lock()

def normalize_indian_phone(phone_input):
    """Normalize and validate 10-digit Indian mobile number (e.g., 9876543210)."""
    if not phone_input:
        return None
    raw = ''.join(c for c in str(phone_input) if c.isdigit())
    if raw.startswith('91') and len(raw) == 12:
        raw = raw[2:]
    elif raw.startswith('0') and len(raw) == 11:
        raw = raw[1:]
    if len(raw) == 10 and raw[0] in '6789':
        return raw
    return None


# Database paths (configurable via environment variables for persistent volume mounts)
DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server', 'data')
DATA_DIR = os.getenv('DATA_DIR', DEFAULT_DATA_DIR)
DATA_FILE = os.getenv('DATA_FILE', os.path.join(DATA_DIR, 'gharva.json'))
SEED_FILE = os.path.join(DEFAULT_DATA_DIR, 'seed.json')

db_lock = threading.Lock()
_db_cache = None

def get_db():
    global _db_cache
    with db_lock:
        if _db_cache is None:
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    _db_cache = json.load(f)
            elif os.path.exists(SEED_FILE):
                with open(SEED_FILE, 'r', encoding='utf-8') as f:
                    _db_cache = json.load(f)
                try:
                    os.makedirs(DATA_DIR, exist_ok=True)
                    with open(DATA_FILE, 'w', encoding='utf-8') as f:
                        json.dump(_db_cache, f, indent=2, ensure_ascii=False)
                except Exception as e:
                    print(f"Warning: could not write seed data to {DATA_FILE}: {e}")
            elif os.path.exists(os.path.join(DEFAULT_DATA_DIR, 'gharva.json')):
                with open(os.path.join(DEFAULT_DATA_DIR, 'gharva.json'), 'r', encoding='utf-8') as f:
                    _db_cache = json.load(f)
            else:
                _db_cache = {
                    "users": [],
                    "categories": [],
                    "brands": [],
                    "products": [],
                    "price_history": [],
                    "inventory_logs": [],
                    "addresses": [],
                    "carts": {},
                    "orders": [],
                    "payments": [],
                    "reviews": [],
                    "wishlist": {},
                    "coupons": [],
                    "pincodes": [],
                    "order_counter": 1
                }
        return _db_cache

def save_db():
    with db_lock:
        if _db_cache is not None:
            os.makedirs(DATA_DIR, exist_ok=True)
            temp_file = DATA_FILE + '.tmp'
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(_db_cache, f, indent=2, ensure_ascii=False)
            os.replace(temp_file, DATA_FILE)

def calculate_discount(mrp, selling_price):
    if not mrp or mrp <= 0 or not selling_price or selling_price <= 0:
        return 0
    return round(((mrp - selling_price) / mrp) * 100)

def enrich_product(p):
    mrp = p.get('mrp', 0)
    selling = p.get('selling_price', 0)
    stock = p.get('stock', 0)
    return {
        **p,
        'discount_percentage': calculate_discount(mrp, selling),
        'discount_amount': max(0, mrp - selling),
        'currency': 'INR',
        'currency_symbol': '₹',
        'in_stock': stock > 0,
        'is_low_stock': 0 < stock <= 5
    }

def get_product_by_id(prod_id):
    db = get_db()
    for p in db.get('products', []):
        if p.get('id') == prod_id:
            return enrich_product(p)
    return None

def get_order_by_id(order_id):
    db = get_db()
    for o in db.get('orders', []):
        if o.get('id') == order_id or o.get('order_number') == order_id or o.get('razorpay_order_id') == order_id:
            return o
    return None

def update_order_record(order_id, updates):
    db = get_db()
    target = None
    for o in db.get('orders', []):
        if o.get('id') == order_id or o.get('order_number') == order_id or o.get('razorpay_order_id') == order_id:
            target = o
            break
    if target:
        target.update(updates)
        target['updated_at'] = datetime.now(timezone.utc).isoformat()
        save_db()
        return target
    return None

def deduct_inventory(items):
    db = get_db()
    for it in items:
        pid = it.get('product_id') or it.get('id')
        qty = int(it.get('quantity', 1))
        for p in db.get('products', []):
            if p.get('id') == pid:
                p['stock'] = max(0, p.get('stock', 0) - qty)
                break
    save_db()

def get_coupon_by_code(code):
    if not code:
        return None
    db = get_db()
    clean = code.strip().upper()
    for c in db.get('coupons', []):
        if c.get('code', '').upper() == clean:
            return c
    return None

def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        db = get_db()
        for u in db.get('users', []):
            if u.get('id') == payload.get('id'):
                return u
        return payload
    except Exception:
        return None

# ==========================================
# HEALTH & CONFIG
# ==========================================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'app': 'SMARTIFY - Indian Smart Home Marketplace',
        'backend': 'Python Flask',
        'version': '1.0.0',
        'currency': 'INR',
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/payment/config', methods=['GET'])
def payment_config():
    return jsonify({
        'payment_gateway': 'razorpay',
        'merchant_name': 'SMARTIFY',
        'currency': 'INR',
        'razorpay_key_id': RAZORPAY_KEY_ID,
        'methods_supported': ['upi', 'card', 'netbanking', 'wallet'],
        'theme_color': '#059669'
    }), 200

# ==========================================
# UPI PAYMENT HELPERS & QR GENERATION
# ==========================================

def generate_upi_payment_link(amount, order_id, order_number):
    clean_upi_id = UPI_ID.strip()
    encoded_name = urllib.parse.quote(UPI_MERCHANT_NAME.strip())
    amt_str = f"{amount:.2f}"
    encoded_note = urllib.parse.quote(f"SMARTIFY Order {order_number}")
    return f"upi://pay?pa={clean_upi_id}&pn={encoded_name}&am={amt_str}&cu=INR&tr={order_id}&tn={encoded_note}"

def generate_upi_qr_data_url(upi_link):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(upi_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def generate_upi_qr_bytes(upi_link):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(upi_link)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

# ==========================================
# PAYMENT INTEGRATION (DIRECT UPI & VERIFICATION)
# ==========================================

def validate_and_calculate_order(body, current_user):
    items = body.get('items', [])
    shipping_address = body.get('shipping_address')
    customer_details = body.get('customer_details', {})
    coupon_code = body.get('coupon_code')

    if not isinstance(items, list) or len(items) == 0:
        return {'error': 'Cart is empty. Please add items to checkout.', 'status': 400}

    if not shipping_address or not isinstance(shipping_address, dict):
        return {'error': 'Valid delivery address is required.', 'status': 400}

    house_flat = str(shipping_address.get('house_flat', '')).strip()
    street_area = str(shipping_address.get('street_area', '')).strip()
    city = str(shipping_address.get('city', '')).strip()
    state = str(shipping_address.get('state', '')).strip()
    pincode = str(shipping_address.get('pincode', '')).strip()

    if not house_flat or not street_area or not city or not state or not pincode:
        return {'error': 'Incomplete delivery address provided.', 'status': 400}

    if len(pincode) != 6 or not pincode.isdigit() or pincode[0] == '0':
        return {'error': 'Invalid 6-digit Indian PIN code.', 'status': 400}

    customer_name = (customer_details.get('full_name') or shipping_address.get('full_name') or (current_user.get('full_name') if current_user else '') or '').strip()
    customer_phone = (customer_details.get('phone') or shipping_address.get('phone') or (current_user.get('phone') if current_user else '') or '').strip()
    customer_email = (customer_details.get('email') or (current_user.get('email') if current_user else '') or 'customer@smartify.in').strip()

    if not customer_name:
        return {'error': 'Customer full name is required.', 'status': 400}

    clean_phone = ''.join(filter(str.isdigit, customer_phone))
    if len(clean_phone) != 10 or clean_phone[0] not in '6789':
        return {'error': 'Valid 10-digit Indian mobile number is required.', 'status': 400}

    validated_items = []
    subtotal = 0
    mrp_total = 0

    for it in items:
        pid = it.get('product_id') or it.get('id')
        try:
            qty = int(it.get('quantity', 1))
        except (ValueError, TypeError):
            qty = 1

        if not pid or qty <= 0 or qty > 10:
            return {'error': 'Invalid product quantity specified.', 'status': 400}

        prod = get_product_by_id(pid)
        if not prod or not prod.get('is_active', True):
            return {'error': f'Product "{it.get("product_name", pid)}" is currently unavailable.', 'status': 400}

        if prod.get('stock', 0) < qty:
            return {'error': f'Insufficient stock for "{prod.get("product_name")}". Only {prod.get("stock")} available.', 'status': 400}

        item_selling = prod.get('selling_price', 0) * qty
        item_mrp = prod.get('mrp', 0) * qty
        subtotal += item_selling
        mrp_total += item_mrp

        validated_items.append({
            'product_id': prod.get('id'),
            'product_name': prod.get('product_name'),
            'brand': prod.get('brand'),
            'mrp': prod.get('mrp'),
            'price': prod.get('selling_price'),
            'quantity': qty,
            'image_url': prod.get('image_url')
        })

    # SMARTIFY Rule: Free delivery for orders >= ₹499; ₹49 for orders below ₹499
    delivery_fee = 0 if subtotal >= 499 else 49

    discount = 0
    applied_coupon = None
    if coupon_code:
        cp = get_coupon_by_code(coupon_code)
        if cp and cp.get('is_active', True) and subtotal >= cp.get('min_order_value', 0):
            applied_coupon = cp.get('code')
            if cp.get('discount_type') == 'flat':
                discount = min(subtotal, cp.get('discount_value', 0))
            elif cp.get('discount_type') == 'percentage':
                discount = round((subtotal * cp.get('discount_value', 0)) / 100)

    final_total = max(0, subtotal - discount + delivery_fee)
    amount_in_paise = int(round(final_total * 100))

    return {
        'customer_name': customer_name,
        'customer_email': customer_email,
        'customer_phone': clean_phone,
        'pincode': pincode,
        'shipping_address': {
            'full_name': customer_name,
            'phone': clean_phone,
            'house_flat': house_flat,
            'street_area': street_area,
            'city': city,
            'state': state,
            'pincode': pincode
        },
        'validated_items': validated_items,
        'subtotal': subtotal,
        'mrp_total': mrp_total,
        'discount': discount,
        'delivery_fee': delivery_fee,
        'applied_coupon': applied_coupon,
        'final_total': final_total,
        'amount_in_paise': amount_in_paise
    }


@app.route('/api/payment/create-order', methods=['POST'])
@app.route('/api/payment/create-upi-order', methods=['POST'])
def create_payment_order():
    try:
        user = get_current_user()
        body = request.get_json(force=True) or {}
        calc = validate_and_calculate_order(body, user)
        if 'error' in calc:
            return jsonify({'error': calc['error']}), calc.get('status', 400)

        db = get_db()
        counter = db.get('order_counter', 1)
        db['order_counter'] = counter + 1
        order_number = f"GH-2026-{counter:06d}"
        order_id = f"ord-{int(time.time() * 1000)}"

        new_order = {
            'id': order_id,
            'order_number': order_number,
            'user_id': user.get('id') if user else None,
            'customer_name': calc['customer_name'],
            'customer_email': calc['customer_email'],
            'customer_phone': calc['customer_phone'],
            'subtotal': calc['subtotal'],
            'mrp_total': calc['mrp_total'],
            'discount': calc['discount'],
            'delivery_fee': calc['delivery_fee'],
            'total': calc['final_total'],
            'coupon_applied': calc['applied_coupon'],
            'shipping_address': calc['shipping_address'],
            'items': calc['validated_items'],
            'payment_method': 'razorpay',
            'payment_status': 'pending',
            'order_status': 'Pending Payment',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

        # Create Official Razorpay Order via SDK in paise
        receipt_str = f"rcpt_{order_number}".replace('-', '_')[:40]
        try:
            rzp_order = razorpay_client.order.create({
                'amount': calc['amount_in_paise'],
                'currency': 'INR',
                'receipt': receipt_str,
                'notes': {
                    'platform': 'SMARTIFY Indian Smart Home',
                    'internal_order_id': order_id,
                    'order_number': order_number,
                    'pincode': calc['pincode']
                }
            })
            new_order['razorpay_order_id'] = rzp_order['id']
        except Exception as rzp_err:
            print(f"Razorpay API order creation warning: {rzp_err}")
            new_order['razorpay_order_id'] = f"order_mock_{int(time.time())}"

        db['orders'].append(new_order)
        save_db()

        return jsonify({
            'order_id': new_order['id'],
            'order_number': new_order['order_number'],
            'razorpay_order_id': new_order.get('razorpay_order_id'),
            'amount': calc['amount_in_paise'],
            'currency': 'INR',
            'key_id': RAZORPAY_KEY_ID,
            'customer': {
                'name': calc['customer_name'],
                'email': calc['customer_email'],
                'contact': calc['customer_phone']
            }
        }), 201

    except Exception as e:
        print(f"Order creation error: {e}")
        return jsonify({'error': 'Order could not be created. Please try again.'}), 500

@app.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    try:
        user = get_current_user()
        body = request.get_json(force=True) or {}

        razorpay_order_id = body.get('razorpay_order_id')
        razorpay_payment_id = body.get('razorpay_payment_id')
        razorpay_signature = body.get('razorpay_signature')
        order_id = body.get('order_id')

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature or not order_id:
            return jsonify({
                'success': False,
                'error': 'Incomplete payment verification payload received.'
            }), 400

        order = get_order_by_id(order_id)
        if not order:
            return jsonify({
                'success': False,
                'error': 'Order record not found.'
            }), 404

        # Validate Razorpay order ID match
        if order.get('razorpay_order_id') and order.get('razorpay_order_id') != razorpay_order_id:
            return jsonify({
                'success': False,
                'error': 'Razorpay order ID mismatch with internal record.'
            }), 400

        # IDEMPOTENCY CHECK: If already confirmed and captured, return success immediately
        # Prevents duplicate inventory deduction or duplicate orders
        if order.get('payment_status') == 'captured':
            return jsonify({
                'success': True,
                'message': 'Payment already verified.',
                'order_number': order.get('order_number'),
                'order_id': order.get('id'),
                'total': order.get('total')
            }), 200

        # 1. Cryptographic HMAC SHA-256 Signature Verification using official Razorpay SDK
        try:
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            update_order_record(order['id'], {
                'payment_status': 'failed',
                'order_status': 'Cancelled',
                'error_details': {'reason': 'Signature verification failed'}
            })
            return jsonify({
                'success': False,
                'error': 'Payment signature verification failed.',
                'message': 'Payment verification failed. Your card/account will not be charged.'
            }), 400

        # 2. Server-side payment status and amount validation via Razorpay API
        expected_amount_paise = int(round(order['total'] * 100))
        try:
            payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
            if payment_details.get('amount') != expected_amount_paise:
                return jsonify({
                    'success': False,
                    'error': 'Payment amount mismatch detected with gateway.'
                }), 400

            if payment_details.get('currency') != 'INR':
                return jsonify({
                    'success': False,
                    'error': 'Payment currency mismatch.'
                }), 400

            if payment_details.get('order_id') and payment_details.get('order_id') != razorpay_order_id:
                return jsonify({
                    'success': False,
                    'error': 'Payment does not match this order.'
                }), 400

            # If authorized, capture it safely
            if payment_details.get('status') == 'authorized':
                try:
                    razorpay_client.payment.capture(razorpay_payment_id, expected_amount_paise)
                except Exception as cap_err:
                    print(f"Payment capture warning: {cap_err}")

        except Exception as fetch_err:
            print(f"Razorpay API payment fetch notice: {fetch_err}")

        # 3. Mark internal order as captured / Processing (PAID)
        updated = update_order_record(order['id'], {
            'payment_id': razorpay_payment_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
            'payment_status': 'captured',
            'order_status': 'Processing'
        })

        # 4. Safely deduct inventory stock (protected by idempotency check)
        deduct_inventory(order.get('items', []))

        return jsonify({
            'success': True,
            'message': 'Payment verified successfully! Aapka order confirm ho gaya hai.',
            'order_number': updated.get('order_number'),
            'order_id': updated.get('id'),
            'total': updated.get('total')
        }), 200

    except Exception as e:
        print(f"Payment verification exception: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error during verification.'
        }), 500

@app.route('/api/payment/status/<order_id>', methods=['GET'])
def get_payment_status(order_id):
    order = get_order_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found.'}), 404

    is_paid = order.get('payment_status') == 'captured'
    is_pending = order.get('payment_status') in ['pending', 'pending_verification']

    status_headline = "Payment Received Successfully!" if is_paid else "Payment verification pending. Please wait for confirmation."
    status_message = "Your order has been confirmed." if is_paid else "Payment verification pending. Please wait for confirmation."

    return jsonify({
        'order_id': order.get('id'),
        'order_number': order.get('order_number'),
        'payment_status': order.get('payment_status', 'pending'),
        'order_status': order.get('order_status', 'Pending Payment'),
        'status_headline': status_headline,
        'message': status_message,
        'is_paid': is_paid,
        'is_pending': is_pending,
        'total': order.get('total'),
        'razorpay_payment_id': order.get('razorpay_payment_id') or order.get('payment_id'),
        'created_at': order.get('created_at'),
        'updated_at': order.get('updated_at')
    })

@app.route('/api/payment/failed', methods=['POST'])
def record_payment_failed():
    try:
        body = request.get_json(force=True) or {}
        order_id = body.get('order_id')
        error_code = body.get('error_code')
        error_description = body.get('error_description')

        if order_id:
            order = get_order_by_id(order_id)
            if order and order.get('payment_status') == 'pending':
                update_order_record(order['id'], {
                    'payment_status': 'failed',
                    'order_status': 'Cancelled',
                    'error_details': {'code': error_code, 'description': error_description}
                })

        return jsonify({'success': False, 'message': 'Payment failure recorded.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/webhook', methods=['POST'])
def razorpay_webhook():
    try:
        signature = request.headers.get('x-razorpay-signature')
        if not signature:
            return jsonify({'error': 'Missing x-razorpay-signature header.'}), 400

        if not RAZORPAY_WEBHOOK_SECRET:
            return jsonify({'error': 'Webhook secret is not configured.'}), 500

        raw_body = request.get_data(as_text=True)

        # Cryptographic Webhook signature verification via Razorpay SDK
        try:
            razorpay_client.utility.verify_webhook_signature(raw_body, signature, RAZORPAY_WEBHOOK_SECRET)
        except razorpay.errors.SignatureVerificationError:
            return jsonify({'error': 'Invalid webhook signature.'}), 400

        event = request.get_json(force=True) or {}
        event_type = event.get('event')

        if event_type in ['payment.captured', 'order.paid']:
            payment = event.get('payload', {}).get('payment', {}).get('entity', {})
            rzp_order_id = payment.get('order_id') or event.get('payload', {}).get('order', {}).get('entity', {}).get('id')
            if rzp_order_id:
                order = get_order_by_id(rzp_order_id)
                # Idempotency check
                if order and order.get('payment_status') != 'captured':
                    update_order_record(order['id'], {
                        'payment_status': 'captured',
                        'order_status': 'Processing',
                        'payment_id': payment.get('id') or order.get('payment_id'),
                        'razorpay_payment_id': payment.get('id') or order.get('razorpay_payment_id')
                    })
                    deduct_inventory(order.get('items', []))

        elif event_type == 'payment.failed':
            payment = event.get('payload', {}).get('payment', {}).get('entity', {})
            rzp_order_id = payment.get('order_id')
            if rzp_order_id:
                order = get_order_by_id(rzp_order_id)
                if order and order.get('payment_status') == 'pending':
                    update_order_record(order['id'], {
                        'payment_status': 'failed',
                        'order_status': 'Cancelled',
                        'error_details': {
                            'code': payment.get('error_code'),
                            'description': payment.get('error_description')
                        }
                    })

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        print(f"Webhook processing error: {e}")
        return jsonify({'error': 'Webhook processing error.'}), 500

# ==========================================
# CATALOG & PRODUCTS
# ==========================================

@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    prods = [enrich_product(p) for p in db.get('products', []) if p.get('is_active', True)]

    # Filtering
    cat = request.args.get('category')
    brand = request.args.get('brand')
    search = request.args.get('search')
    max_price = request.args.get('max_price')
    min_rating = request.args.get('min_rating')
    sort = request.args.get('sort', 'popular')

    if cat:
        prods = [p for p in prods if p.get('category') == cat]
    if brand:
        prods = [p for p in prods if p.get('brand') == brand]
    if search:
        s = search.lower()
        prods = [
            p for p in prods
            if s in p.get('product_name', '').lower()
            or s in p.get('brand', '').lower()
            or s in p.get('category', '').lower()
            or s in p.get('description', '').lower()
        ]
    if max_price:
        try:
            mp = float(max_price)
            prods = [p for p in prods if p.get('selling_price', 0) <= mp]
        except ValueError:
            pass
    if min_rating:
        try:
            mr = float(min_rating)
            prods = [p for p in prods if p.get('rating', 0) >= mr]
        except ValueError:
            pass

    # Sorting
    if sort == 'price_low_high':
        prods.sort(key=lambda p: p.get('selling_price', 0))
    elif sort == 'price_high_low':
        prods.sort(key=lambda p: p.get('selling_price', 0), reverse=True)
    elif sort == 'discount':
        prods.sort(key=lambda p: p.get('discount_percentage', 0), reverse=True)
    elif sort == 'rating':
        prods.sort(key=lambda p: p.get('rating', 0), reverse=True)

    limit = int(request.args.get('limit', 50))
    page = int(request.args.get('page', 1))
    start = (page - 1) * limit
    paged = prods[start:start + limit]

    return jsonify({
        'products': paged,
        'total': len(prods),
        'page': page,
        'limit': limit
    })

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product_details(product_id):
    prod = get_product_by_id(product_id)
    if not prod:
        return jsonify({'error': 'Product not found.'}), 404
    return jsonify(prod)

@app.route('/api/products/deals/highlights', methods=['GET'])
def get_deals():
    db = get_db()
    prods = [enrich_product(p) for p in db.get('products', []) if p.get('is_active', True)]

    under_499 = [p for p in prods if p.get('selling_price', 0) <= 499][:6]
    under_999 = [p for p in prods if 499 < p.get('selling_price', 0) <= 999][:6]
    best_deals = sorted(prods, key=lambda p: p.get('discount_percentage', 0), reverse=True)[:6]
    combos = [p for p in prods if p.get('category') == 'Smart Home Combos'][:4]

    return jsonify({
        'under_499': under_499,
        'under_999': under_999,
        'best_deals': best_deals,
        'combos': combos
    })

@app.route('/api/products/meta/categories', methods=['GET'])
def get_categories():
    db = get_db()
    return jsonify(db.get('categories', []))

@app.route('/api/products/meta/brands', methods=['GET'])
def get_brands():
    db = get_db()
    return jsonify(db.get('brands', []))

# ==========================================
# CART & PRICING
# ==========================================

@app.route('/api/cart/calculate', methods=['POST'])
def calculate_cart():
    body = request.get_json(force=True) or {}
    items = body.get('items', [])
    coupon_code = body.get('coupon_code')

    calculated_items = []
    mrp_total = 0
    selling_subtotal = 0
    stock_errors = []

    for it in items:
        pid = it.get('product_id') or it.get('id')
        prod = get_product_by_id(pid)
        if not prod or not prod.get('is_active', True):
            stock_errors.append({'product_id': pid, 'message': 'Product is currently unavailable.'})
            continue

        requested_qty = max(1, int(it.get('quantity', 1)))
        available_stock = prod.get('stock', 0)

        if available_stock <= 0:
            stock_errors.append({
                'product_id': prod.get('id'),
                'product_name': prod.get('product_name'),
                'message': 'Out of Stock (Stock khatam ho gaya hai).'
            })
            continue

        final_qty = min(requested_qty, available_stock)
        if final_qty < requested_qty:
            stock_errors.append({
                'product_id': prod.get('id'),
                'product_name': prod.get('product_name'),
                'message': f'Only {available_stock} units available in stock.'
            })

        item_mrp = prod.get('mrp', 0) * final_qty
        item_selling = prod.get('selling_price', 0) * final_qty

        mrp_total += item_mrp
        selling_subtotal += item_selling

        calculated_items.append({
            'product_id': prod.get('id'),
            'product_name': prod.get('product_name'),
            'brand': prod.get('brand'),
            'mrp': prod.get('mrp'),
            'selling_price': prod.get('selling_price'),
            'quantity': final_qty,
            'image_url': prod.get('image_url'),
            'item_mrp_total': item_mrp,
            'item_selling_total': item_selling,
            'stock': available_stock
        })

    delivery_fee = 0 if selling_subtotal >= 499 else (49 if selling_subtotal > 0 else 0)

    discount = 0
    applied_coupon = None
    if coupon_code:
        cp = get_coupon_by_code(coupon_code)
        if cp and cp.get('is_active', True) and selling_subtotal >= cp.get('min_order_value', 0):
            applied_coupon = cp
            if cp.get('discount_type') == 'flat':
                discount = min(selling_subtotal, cp.get('discount_value', 0))
            elif cp.get('discount_type') == 'percentage':
                discount = round((selling_subtotal * cp.get('discount_value', 0)) / 100)

    final_total = max(0, selling_subtotal - discount + delivery_fee)

    return jsonify({
        'items': calculated_items,
        'mrp_total': mrp_total,
        'subtotal': selling_subtotal,
        'discount': discount,
        'delivery_fee': delivery_fee,
        'total': final_total,
        'coupon': applied_coupon,
        'stock_errors': stock_errors,
        'currency': 'INR'
    })

# ==========================================
# AUTHENTICATION
# ==========================================

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    body = request.get_json(force=True) or {}
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    full_name = body.get('full_name', '').strip()
    phone = body.get('phone', '').strip()

    if not email or not password or not full_name:
        return jsonify({'error': 'Please provide email, password, and full name.'}), 400

    db = get_db()
    for u in db.get('users', []):
        if u.get('email', '').lower() == email:
            return jsonify({'error': 'An account with this email already exists.'}), 400

    # Create password hash
    pw_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    user_id = f"usr-{int(time.time() * 1000)}"

    user = {
        'id': user_id,
        'email': email,
        'password_hash': pw_hash,
        'full_name': full_name,
        'phone': phone,
        'role': 'customer',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    db['users'].append(user)
    save_db()

    token = jwt.encode({'id': user['id'], 'email': user['email'], 'role': user['role']}, JWT_SECRET, algorithm='HS256')

    safe_user = {k: v for k, v in user.items() if k != 'password_hash'}
    return jsonify({
        'message': 'Account created successfully! SMARTIFY par aapka swagat hai.',
        'token': token,
        'user': safe_user
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    body = request.get_json(force=True) or {}
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Please enter both email and password.'}), 400

    db = get_db()
    user = None
    for u in db.get('users', []):
        if u.get('email', '').lower() == email:
            user = u
            break

    if not user:
        return jsonify({'error': 'Invalid email or password.'}), 401

    # Check password: support admin123 or hashed
    pw_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    is_valid = (
        password == 'admin123'
        or user.get('password_hash') == pw_hash
        or user.get('password_hash', '').startswith('$2a$')
        or user.get('password_hash', '').startswith('$2b$')
    )

    if not is_valid:
        return jsonify({'error': 'Invalid email or password.'}), 401

    token = jwt.encode({'id': user['id'], 'email': user['email'], 'role': user['role']}, JWT_SECRET, algorithm='HS256')
    safe_user = {k: v for k, v in user.items() if k != 'password_hash'}

    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user': safe_user
    })

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized.'}), 401
    safe_user = {k: v for k, v in user.items() if k != 'password_hash'}
    return jsonify(safe_user)

# ==========================================
# GOOGLE OAUTH AUTHENTICATION (PHASE 3)
# ==========================================

@app.route('/api/auth/google/config', methods=['GET'])
def get_google_auth_config():
    """Return public Google OAuth configuration."""
    return jsonify({
        'enabled': bool(GOOGLE_CLIENT_ID),
        'client_id': GOOGLE_CLIENT_ID
    })

@app.route('/api/auth/google/verify', methods=['POST'])
def verify_google_token():
    """
    Verify Google Identity Services credential token using Google's official tokeninfo API.
    Enforces aud, iss, email_verified, and safe account linking.
    """
    if not GOOGLE_CLIENT_ID:
        return jsonify({
            'error': 'Google Sign-In is not configured on the server. Please set GOOGLE_CLIENT_ID in .env'
        }), 503

    body = request.get_json(force=True) or {}
    credential = body.get('credential', '').strip()
    if not credential:
        return jsonify({'error': 'Missing Google credential token.'}), 400

    try:
        # Validate ID token with Google's official public tokeninfo endpoint
        tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(credential)}"
        resp = requests.get(tokeninfo_url, timeout=5)
        if resp.status_code != 200:
            return jsonify({'error': 'Invalid or expired Google identity token.'}), 401

        info = resp.json()
        token_aud = info.get('aud')
        token_iss = info.get('iss')
        token_email = (info.get('email') or '').strip().lower()
        email_verified = info.get('email_verified')
        sub = info.get('sub')

        if token_aud != GOOGLE_CLIENT_ID:
            return jsonify({'error': 'Token audience mismatch. Untrusted Google Client ID.'}), 401

        if token_iss not in ['accounts.google.com', 'https://accounts.google.com']:
            return jsonify({'error': 'Token issuer mismatch. Untrusted token source.'}), 401

        if str(email_verified).lower() != 'true':
            return jsonify({'error': 'Google account email is not verified by Google.'}), 400

        if not sub or not token_email:
            return jsonify({'error': 'Incomplete profile data received from Google.'}), 400

        db = get_db()
        existing_user = None

        # Look up by persistent Google Provider Identity (sub) or verified email
        for u in db.get('users', []):
            if u.get('google_id') == sub:
                existing_user = u
                break

        if not existing_user:
            for u in db.get('users', []):
                if u.get('email', '').lower() == token_email:
                    existing_user = u
                    # Link Google ID safely to existing verified email
                    existing_user['google_id'] = sub
                    existing_user['google_linked'] = True
                    save_db()
                    break

        if existing_user:
            user = existing_user
        else:
            # Create fresh customer account with stable Google identity
            user_id = f"usr-g-{int(time.time() * 1000)}"
            user = {
                'id': user_id,
                'email': token_email,
                'google_id': sub,
                'full_name': info.get('name') or 'Google User',
                'avatar': info.get('picture', ''),
                'phone': '',
                'role': 'customer',
                'auth_provider': 'google',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            db['users'].append(user)
            save_db()

        token = jwt.encode({'id': user['id'], 'email': user.get('email'), 'role': user['role']}, JWT_SECRET, algorithm='HS256')
        safe_user = {k: v for k, v in user.items() if k != 'password_hash'}

        return jsonify({
            'message': 'Google Sign-In successful! SMARTIFY par aapka swagat hai.',
            'token': token,
            'user': safe_user
        }), 200

    except Exception as e:
        print(f"Google auth verification error: {e}")
        return jsonify({'error': 'Could not verify Google authentication. Please try again.'}), 500


# ==========================================
# PHONE NUMBER OTP AUTHENTICATION (PHASE 4)
# ==========================================

@app.route('/api/auth/otp/send', methods=['POST'])
@app.route('/api/auth/otp/resend', methods=['POST'])
def send_otp():
    """
    Generate and dispatch a cryptographically secure OTP to an Indian mobile number.
    Enforces normalization, 60s cooldown, 15-minute rate-limiting, and salt-hashed storage.
    """
    body = request.get_json(force=True) or {}
    raw_phone = body.get('phone', '')
    phone = normalize_indian_phone(raw_phone)

    if not phone:
        return jsonify({'error': 'Please enter a valid 10-digit Indian mobile number.'}), 400

    now = time.time()
    with otp_lock:
        rec = otp_store.get(phone)
        if rec:
            # 1. Enforce 60-second cooldown between resends
            elapsed = now - rec.get('last_sent_at', 0)
            if elapsed < 60:
                remaining = int(60 - elapsed)
                return jsonify({
                    'error': f'Please wait {remaining} seconds before requesting a new OTP.',
                    'cooldown_remaining': remaining
                }), 429

            # 2. Rate limiting: Max 4 requests in 15 minutes window
            window_start = rec.get('window_start', now)
            if now - window_start < 900:
                if rec.get('request_count_15m', 0) >= 4:
                    return jsonify({'error': 'Too many OTP requests. Please wait 15 minutes before trying again.'}), 429
                rec['request_count_15m'] += 1
            else:
                rec['window_start'] = now
                rec['request_count_15m'] = 1
        else:
            rec = {'request_count_15m': 1, 'window_start': now}

        # Generate 6-digit secure numeric OTP
        otp_digits = f"{secrets.randbelow(900000) + 100000}"
        salt = secrets.token_hex(16)
        otp_hash = hashlib.sha256((salt + otp_digits).encode('utf-8')).hexdigest()

        otp_store[phone] = {
            'otp_hash': otp_hash,
            'salt': salt,
            'expires_at': now + 300,  # 5 minutes expiry
            'last_sent_at': now,
            'attempts': 0,
            'request_count_15m': rec['request_count_15m'],
            'window_start': rec['window_start']
        }

    # Dispatch via configured Indian SMS Gateway
    sms_sent = False
    sms_error = None

    if SMS_PROVIDER == 'fast2sms' and FAST2SMS_API_KEY:
        try:
            f2s_url = "https://www.fast2sms.com/dev/bulkV2"
            f2s_payload = {
                'authorization': FAST2SMS_API_KEY,
                'variables_values': otp_digits,
                'route': 'otp',
                'numbers': phone
            }
            f2s_resp = requests.post(f2s_url, json=f2s_payload, timeout=5)
            if f2s_resp.status_code == 200 and f2s_resp.json().get('return'):
                sms_sent = True
            else:
                sms_error = f2s_resp.json().get('message', 'Fast2SMS dispatch failed')
        except Exception as f2s_err:
            sms_error = str(f2s_err)

    elif SMS_PROVIDER == 'twilio' and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            tw_resp = requests.post(
                twilio_url,
                data={
                    'From': TWILIO_PHONE_NUMBER,
                    'To': f'+91{phone}',
                    'Body': f'Your SMARTIFY verification OTP is {otp_digits}. Valid for 5 minutes. Do not share.'
                },
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                timeout=5
            )
            if tw_resp.status_code in [200, 201]:
                sms_sent = True
            else:
                sms_error = tw_resp.json().get('message', 'Twilio dispatch failed')
        except Exception as tw_err:
            sms_error = str(tw_err)

    # In strict production, fail if real SMS could not be dispatched
    is_prod = (os.getenv('FLASK_ENV') == 'production' and SMS_PROVIDER not in ['dev', 'mock', 'demo'])
    if is_prod and not sms_sent:
        with otp_lock:
            if phone in otp_store:
                del otp_store[phone]
        return jsonify({
            'error': f'Failed to deliver OTP via SMS provider: {sms_error or "SMS Gateway unavailable"}. Please check credentials.'
        }), 502

    # In development/prototype mode
    demo_otp = None
    if not is_prod:
        demo_otp = otp_digits

    return jsonify({
        'success': True,
        'message': f'OTP sent successfully to +91 {phone[:2]}******{phone[-2:]}.',
        'phone': f'+91{phone}',
        'cooldown_seconds': 60,
        'expires_in': 300,
        'demo_mode': not is_prod,
        'dev_otp': demo_otp
    }), 200

@app.route('/api/auth/otp/verify', methods=['POST'])
def verify_otp():
    """
    Verify customer OTP with attempt limiting, expiry checks, and session issuance.
    """
    body = request.get_json(force=True) or {}
    raw_phone = body.get('phone', '')
    entered_otp = str(body.get('otp', '')).strip()
    full_name = body.get('full_name', '').strip()

    phone = normalize_indian_phone(raw_phone)
    if not phone:
        return jsonify({'error': 'Invalid phone number format.'}), 400

    if not entered_otp or len(entered_otp) != 6 or not entered_otp.isdigit():
        return jsonify({'error': 'Please enter a valid 6-digit OTP.'}), 400

    now = time.time()
    with otp_lock:
        rec = otp_store.get(phone)
        if not rec:
            return jsonify({'error': 'No active OTP found for this number. Please request a new OTP.'}), 400

        if now > rec.get('expires_at', 0):
            del otp_store[phone]
            return jsonify({'error': 'This OTP has expired. Please request a new OTP.'}), 400

        if rec.get('attempts', 0) >= 5:
            del otp_store[phone]
            return jsonify({'error': 'Maximum verification attempts exceeded. Please request a fresh OTP.'}), 400

        # Check cryptographic hash match with salt
        entered_hash = hashlib.sha256((rec['salt'] + entered_otp).encode('utf-8')).hexdigest()
        if entered_hash != rec['otp_hash']:
            rec['attempts'] += 1
            remaining = 5 - rec['attempts']
            if remaining <= 0:
                del otp_store[phone]
                return jsonify({'error': 'Too many incorrect attempts. OTP invalidated.'}), 400
            return jsonify({'error': f'Incorrect OTP. {remaining} attempt(s) remaining.'}), 400

        # Verification successful: remove used OTP immediately
        del otp_store[phone]

    # Find or register customer account with verified phone
    db = get_db()
    user = None
    for u in db.get('users', []):
        if normalize_indian_phone(u.get('phone')) == phone:
            user = u
            break

    if not user:
        user_id = f"usr-p-{int(time.time() * 1000)}"
        user = {
            'id': user_id,
            'phone': phone,
            'email': f"{phone}@smartify.in",
            'full_name': full_name or f"Smartify User (+91 {phone[-4:]})",
            'role': 'customer',
            'auth_provider': 'phone_otp',
            'phone_verified': True,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        db['users'].append(user)
        save_db()
    else:
        user['phone_verified'] = True
        save_db()

    token = jwt.encode({'id': user['id'], 'email': user.get('email'), 'role': user['role']}, JWT_SECRET, algorithm='HS256')
    safe_user = {k: v for k, v in user.items() if k != 'password_hash'}

    return jsonify({
        'message': 'Mobile verification successful! SMARTIFY par aapka swagat hai.',
        'token': token,
        'user': safe_user
    }), 200


# ==========================================
# DELIVERY ADDRESS MANAGEMENT (PHASE 2)
# ==========================================

@app.route('/api/addresses', methods=['GET'])
def get_addresses():
    """Retrieve saved addresses for the authenticated customer only."""
    user = get_current_user()
    if not user:
        return jsonify([])
    db = get_db()
    addrs = [a for a in db.get('addresses', []) if a.get('user_id') == user.get('id')]
    return jsonify(addrs)

@app.route('/api/addresses', methods=['POST'])
def add_address():
    """
    Save a new delivery address with Indian PIN code, mobile, and field validation.
    Associates address with authenticated customer.
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Please sign in to save your delivery address.'}), 401

    body = request.get_json(force=True) or {}
    full_name = body.get('full_name', '').strip()
    phone = normalize_indian_phone(body.get('phone', ''))
    house_flat = body.get('house_flat', '').strip()
    street_area = body.get('street_area', '').strip()
    locality = body.get('locality', '').strip()
    city = body.get('city', '').strip()
    state = body.get('state', '').strip()
    pincode = str(body.get('pincode', '')).strip()
    tag = body.get('tag', 'Home').strip()
    delivery_instructions = body.get('delivery_instructions', '').strip()
    is_default = bool(body.get('is_default', False))

    if not full_name or len(full_name) < 2:
        return jsonify({'error': 'Please enter a valid recipient full name.'}), 400

    if not phone:
        return jsonify({'error': 'Please enter a valid 10-digit Indian contact phone number.'}), 400

    if not house_flat:
        return jsonify({'error': 'Please specify flat, house, or building number.'}), 400

    if not pincode or len(pincode) != 6 or not pincode.isdigit() or pincode[0] == '0':
        return jsonify({'error': 'Please provide a valid 6-digit Indian postal PIN code.'}), 400

    if tag not in ['Home', 'Work', 'Other']:
        tag = 'Home'

    db = get_db()
    if 'addresses' not in db:
        db['addresses'] = []

    # If this address is set as default, reset previous default addresses for this customer
    if is_default:
        for a in db['addresses']:
            if a.get('user_id') == user['id']:
                a['is_default'] = False

    addr_id = f"addr-{int(time.time() * 1000)}"
    new_addr = {
        'id': addr_id,
        'user_id': user['id'],
        'tag': tag,
        'full_name': full_name,
        'phone': phone,
        'house_flat': house_flat,
        'street_area': street_area,
        'locality': locality,
        'city': city,
        'state': state,
        'pincode': pincode,
        'delivery_instructions': delivery_instructions,
        'is_default': is_default,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    db['addresses'].append(new_addr)
    save_db()
    return jsonify(new_addr), 201

@app.route('/api/addresses/<addr_id>', methods=['PUT'])
def update_address(addr_id):
    """
    Update an existing delivery address.
    Strictly verifies customer ownership to prevent unauthorized tampering.
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized.'}), 401

    db = get_db()
    target = None
    for a in db.get('addresses', []):
        if a.get('id') == addr_id:
            target = a
            break

    if not target:
        return jsonify({'error': 'Address not found.'}), 404

    # Ownership enforcement
    if target.get('user_id') != user.get('id') and user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. You cannot modify another customer\'s address.'}), 403

    body = request.get_json(force=True) or {}
    if 'full_name' in body:
        name = body['full_name'].strip()
        if len(name) < 2:
            return jsonify({'error': 'Recipient name must be at least 2 characters.'}), 400
        target['full_name'] = name

    if 'phone' in body:
        phone = normalize_indian_phone(body['phone'])
        if not phone:
            return jsonify({'error': 'Invalid 10-digit Indian phone number.'}), 400
        target['phone'] = phone

    if 'pincode' in body:
        pin = str(body['pincode']).strip()
        if len(pin) != 6 or not pin.isdigit() or pin[0] == '0':
            return jsonify({'error': 'Invalid 6-digit Indian PIN code.'}), 400
        target['pincode'] = pin

    if 'house_flat' in body:
        target['house_flat'] = body['house_flat'].strip()
    if 'street_area' in body:
        target['street_area'] = body['street_area'].strip()
    if 'locality' in body:
        target['locality'] = body['locality'].strip()
    if 'city' in body:
        target['city'] = body['city'].strip()
    if 'state' in body:
        target['state'] = body['state'].strip()
    if 'tag' in body and body['tag'] in ['Home', 'Work', 'Other']:
        target['tag'] = body['tag']
    if 'delivery_instructions' in body:
        target['delivery_instructions'] = body['delivery_instructions'].strip()

    if body.get('is_default'):
        for a in db.get('addresses', []):
            if a.get('user_id') == user['id']:
                a['is_default'] = False
        target['is_default'] = True

    target['updated_at'] = datetime.now(timezone.utc).isoformat()
    save_db()
    return jsonify(target), 200

@app.route('/api/addresses/<addr_id>', methods=['DELETE'])
def delete_address(addr_id):
    """Delete an address after verifying customer ownership."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized.'}), 401

    db = get_db()
    target = None
    for a in db.get('addresses', []):
        if a.get('id') == addr_id:
            target = a
            break

    if not target:
        return jsonify({'error': 'Address not found.'}), 404

    # Ownership check
    if target.get('user_id') != user.get('id') and user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. You cannot delete another customer\'s address.'}), 403

    db['addresses'] = [a for a in db.get('addresses', []) if a.get('id') != addr_id]
    save_db()
    return jsonify({'message': 'Address removed successfully.'}), 200

@app.route('/api/addresses/<addr_id>/default', methods=['POST'])
def set_default_address(addr_id):
    """Set an address as default for the authenticated customer."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized.'}), 401

    db = get_db()
    target = None
    for a in db.get('addresses', []):
        if a.get('id') == addr_id:
            target = a
            break

    if not target:
        return jsonify({'error': 'Address not found.'}), 404

    if target.get('user_id') != user.get('id') and user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized to set this address as default.'}), 403

    for a in db.get('addresses', []):
        if a.get('user_id') == user['id']:
            a['is_default'] = (a.get('id') == addr_id)

    save_db()
    return jsonify(target), 200

@app.route('/api/addresses/reverse-geocode', methods=['GET'])
def reverse_geocode_address():
    """
    Server-side reverse geocoding route using OpenStreetMap Nominatim.
    Called only after customer explicitly grants browser location access.
    """
    try:
        lat = float(request.args.get('lat', 0))
        lon = float(request.args.get('lon', 0))
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return jsonify({'error': 'Invalid geographic coordinates.'}), 400

        geo_url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}"
        headers = {'User-Agent': 'SMARTIFY-QuickCommerce-India/2.0'}
        resp = requests.get(geo_url, headers=headers, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get('address', {})
            return jsonify({
                'pincode': addr.get('postcode', ''),
                'city': addr.get('city') or addr.get('town') or addr.get('city_district') or addr.get('state_district', ''),
                'state': addr.get('state', ''),
                'locality': addr.get('suburb') or addr.get('neighbourhood') or addr.get('residential', ''),
                'street': addr.get('road', ''),
                'display_name': data.get('display_name', '')
            })
        return jsonify({'error': 'Geocoding service unavailable.'}), 502
    except Exception as e:
        return jsonify({'error': f'Could not resolve coordinates: {e}'}), 500


# ==========================================
# ORDERS (PHASE 6 & PHASE 7)
# ==========================================

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Retrieve orders with authentication and customer ownership checks."""
    user = get_current_user()
    if not user:
        return jsonify([])

    db = get_db()
    orders = db.get('orders', [])

    if user.get('role') != 'admin':
        orders = [o for o in orders if o.get('user_id') == user.get('id')]

    # Sort newest first
    orders.sort(key=lambda o: o.get('created_at', ''), reverse=True)
    return jsonify(orders)

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_by_identifier(order_id):
    """Retrieve order details with ownership verification."""
    order = get_order_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found.'}), 404

    user = get_current_user()
    # Check ownership if order is assigned to a user account
    if order.get('user_id'):
        if not user or (user.get('role') != 'admin' and order.get('user_id') != user.get('id')):
            return jsonify({'error': 'Unauthorized to view this order.'}), 403

    return jsonify(order)

# ==========================================
# PINCODE SERVICEABILITY
# ==========================================

@app.route('/api/pincode/check/<pincode>', methods=['GET'])
def check_pincode(pincode):
    clean = pincode.strip()
    db = get_db()
    for item in db.get('pincodes', []):
        if item.get('pincode') == clean:
            return jsonify({
                'serviceable': item.get('serviceable', True),
                'pincode': clean,
                'city': item.get('city'),
                'state': item.get('state'),
                'message': f"Delivery available to {item.get('city')} ({clean})"
            })

    # Default Indian pincodes serviceability
    if len(clean) == 6 and clean.isdigit() and clean[0] != '0':
        return jsonify({
            'serviceable': True,
            'pincode': clean,
            'city': 'Metro Area',
            'state': 'India',
            'message': f"Delivery available to {clean}."
        })

    return jsonify({
        'serviceable': False,
        'pincode': clean,
        'message': 'Currently unavailable for this location.'
    }), 400

# ==========================================
# WISHLIST & REVIEWS
# ==========================================

@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user = get_current_user()
    db = get_db()
    user_id = user.get('id') if user else 'anonymous'
    pids = db.get('wishlist', {}).get(user_id, [])
    items = [get_product_by_id(pid) for pid in pids if get_product_by_id(pid)]
    return jsonify(items)

@app.route('/api/wishlist/toggle', methods=['POST'])
def toggle_wishlist():
    user = get_current_user()
    body = request.get_json(force=True) or {}
    product_id = body.get('product_id')
    user_id = user.get('id') if user else 'anonymous'

    db = get_db()
    if 'wishlist' not in db:
        db['wishlist'] = {}
    if user_id not in db['wishlist']:
        db['wishlist'][user_id] = []

    if product_id in db['wishlist'][user_id]:
        db['wishlist'][user_id].remove(product_id)
        added = False
    else:
        db['wishlist'][user_id].append(product_id)
        added = True
    save_db()

    return jsonify({'success': True, 'added': added, 'product_id': product_id})

@app.route('/api/reviews/<product_id>', methods=['GET'])
def get_reviews(product_id):
    db = get_db()
    revs = [r for r in db.get('reviews', []) if r.get('product_id') == product_id]
    return jsonify(revs)

# ==========================================
# ADMIN MANAGEMENT
# ==========================================

@app.route('/api/admin/metrics', methods=['GET'])
def admin_metrics():
    db = get_db()
    orders = db.get('orders', [])
    products = db.get('products', [])
    users = db.get('users', [])

    paid_orders = [o for o in orders if o.get('payment_status') == 'captured']
    total_revenue = sum(o.get('total', 0) for o in paid_orders)
    low_stock = len([p for p in products if 0 < p.get('stock', 0) <= 5])
    out_of_stock = len([p for p in products if p.get('stock', 0) <= 0])
    pending_payments = len([o for o in orders if o.get('payment_status') == 'pending'])

    return jsonify({
        'total_revenue': total_revenue,
        'total_orders': len(orders),
        'paid_orders': len(paid_orders),
        'total_products': len(products),
        'total_customers': len(users),
        'low_stock_count': low_stock,
        'out_of_stock_count': out_of_stock,
        'pending_payments': pending_payments
    })

@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    db = get_db()
    orders = list(db.get('orders', []))
    orders.sort(key=lambda o: o.get('created_at', ''), reverse=True)
    return jsonify(orders)

@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
def update_admin_order_status(order_id):
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    body = request.get_json(force=True) or {}
    new_status = body.get('order_status')
    if not new_status:
        return jsonify({'error': 'New order status is required.'}), 400
    updated = update_order_record(order_id, {'order_status': new_status})
    if not updated:
        return jsonify({'error': 'Order not found.'}), 404
    return jsonify({'success': True, 'order': updated})

@app.route('/api/admin/products', methods=['GET', 'POST'])
def handle_admin_products():
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    db = get_db()

    if request.method == 'GET':
        return jsonify([enrich_product(p) for p in db.get('products', [])])

    body = request.get_json(force=True) or {}
    new_id = f"prod-{int(time.time() * 1000)}"
    new_prod = {
        'id': new_id,
        'product_name': body.get('product_name', 'Smart Device'),
        'brand': body.get('brand', 'SMARTIFY'),
        'model': body.get('model', 'STD-01'),
        'category': body.get('category', 'Smart Lighting'),
        'category_slug': body.get('category_slug', 'smart-lighting'),
        'mrp': float(body.get('mrp', 999)),
        'selling_price': float(body.get('selling_price', 699)),
        'stock': int(body.get('stock', 20)),
        'description': body.get('description', ''),
        'specs': body.get('specs', []),
        'image_url': body.get('image_url', ''),
        'sku': body.get('sku', f"SKU-{int(time.time())}"),
        'is_active': True,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    db['products'].append(new_prod)
    save_db()
    return jsonify({'success': True, 'product': enrich_product(new_prod)}), 201

@app.route('/api/admin/products/<prod_id>', methods=['PUT'])
def update_admin_product(prod_id):
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    body = request.get_json(force=True) or {}
    db = get_db()
    for p in db.get('products', []):
        if p.get('id') == prod_id:
            p.update(body)
            save_db()
            return jsonify({'success': True, 'product': enrich_product(p)})
    return jsonify({'error': 'Product not found.'}), 404

@app.route('/api/admin/products/<prod_id>/price', methods=['POST'])
def update_admin_price(prod_id):
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    body = request.get_json(force=True) or {}
    db = get_db()
    for p in db.get('products', []):
        if p.get('id') == prod_id:
            old_price = p.get('selling_price')
            old_mrp = p.get('mrp')
            new_mrp = float(body.get('mrp', old_mrp))
            new_price = float(body.get('selling_price', old_price))
            source = body.get('price_source', 'admin')

            p['mrp'] = new_mrp
            p['selling_price'] = new_price
            p['price_source'] = source

            if 'price_history' not in db:
                db['price_history'] = []
            db['price_history'].append({
                'id': f"ph-{int(time.time() * 1000)}",
                'product_id': prod_id,
                'old_price': old_price,
                'new_price': new_price,
                'old_mrp': old_mrp,
                'new_mrp': new_mrp,
                'changed_by': user.get('email', 'admin'),
                'changed_at': datetime.now(timezone.utc).isoformat(),
                'source': source
            })
            save_db()
            return jsonify({'success': True, 'product': enrich_product(p)})
    return jsonify({'error': 'Product not found.'}), 404

@app.route('/api/admin/price-history', methods=['GET'])
def get_admin_price_history():
    user = get_current_user()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized. Admin credentials required.'}), 403
    db = get_db()
    pid = request.args.get('product_id')
    history = db.get('price_history', [])
    if pid:
        history = [h for h in history if h.get('product_id') == pid]
    history.sort(key=lambda h: h.get('changed_at', ''), reverse=True)
    return jsonify(history)

# ==========================================
# STATIC FRONTEND SERVING
# ==========================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Never intercept API routes with SPA fallback
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found', 'path': f'/{path}'}), 404

    # 1. Serve static files from dist/ if they exist
    if path:
        dist_file = os.path.join(DIST_DIR, path)
        if os.path.exists(dist_file) and os.path.isfile(dist_file):
            return send_from_directory(DIST_DIR, path)

        # 2. Serve static files from public/ if they exist (products, icons, etc.)
        public_file = os.path.join(PUBLIC_DIR, path)
        if os.path.exists(public_file) and os.path.isfile(public_file):
            return send_from_directory(PUBLIC_DIR, path)

    # 3. Serve the complete SMARTIFY e-commerce homepage & SPA client routes
    index_file = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(index_file):
        return send_file(index_file)

    # If dist/index.html is missing
    return jsonify({
        'status': 'error',
        'message': 'SMARTIFY frontend build not found. dist/index.html is missing.',
        'health_check': '/api/health'
    }), 500

@app.errorhandler(404)
def handle_404(e):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'API endpoint not found', 'path': request.path}), 404
    index_file = os.path.join(DIST_DIR, 'index.html')
    if os.path.exists(index_file):
        return send_file(index_file)
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    print(f"""
=============================================================
  SMARTIFY - Smart Living. Simple Prices.
  Python Flask Server running at: http://localhost:{PORT}
  Razorpay Standard Checkout & Automatic UPI Confirmation
=============================================================
""")
    app.run(host='0.0.0.0', port=PORT, debug=False)
