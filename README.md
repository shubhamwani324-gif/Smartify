# Smartify - Quick-Commerce Smart Home Marketplace

SMARTIFY is a modern, high-speed Indian smart home e-commerce web platform inspired by quick-commerce user experiences (Blinkit style). It features a complete product catalog, categories, brand filtering, cart, order management, user authentication, promo codes, admin dashboard, and seamless payments powered by Razorpay Standard Checkout (UPI, Cards, Netbanking) with server-side signature verification.

---

## 🌟 Key Features

- **Quick-Commerce UI / UX**: High-converting, responsive interface with instant search, category filtering, sticky cart tray, and fast checkout.
- **Product & Inventory Management**: 38+ curated smart home products (Smart Lighting, Security, Audio, Automation, etc.).
- **Smart Cart & Coupons**: Dynamic discount codes, delivery fees, and order summary calculations.
- **Payment Gateway**: Integrated with Razorpay Standard Checkout supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Cards, and Net Banking with secure server-side signature verification.
- **Order Tracking & Admin Dashboard**: Complete order history, order status updates, inventory insights, and admin portal.
- **Dual Persistent Storage**: JSON-based file storage with automatic fallback seed dataset, ready for cloud persistent storage or databases on production.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, CSS Design System
- **Backend**: Python Flask, Flask-CORS, PyJWT, Python-dotenv, Requests
- **Payment Gateway**: Razorpay Python SDK (`razorpay`), Razorpay Checkout.js
- **Production Server**: Gunicorn WSGI

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/shubhamwani324-gif/Smartify.git
cd Smartify

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Razorpay Test Key ID & Key Secret
```

### 3. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Build production bundle for Flask to serve
npm run build
```

### 4. Run the Application
```bash
# Run Flask app (serves API and production frontend at http://localhost:5000)
python app.py
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🌐 Deployment on Render

SMARTIFY is pre-configured for one-click deployment on [Render](https://render.com):

1. **Service Type**: Web Service
2. **Environment**: Python 3
3. **Build Command**:
   ```bash
   pip install -r requirements.txt && npm install && npm run build
   ```
4. **Start Command**:
   ```bash
   gunicorn -w 2 -b 0.0.0.0:$PORT app:app
   ```
5. **Environment Variables**:
   - `SECRET_KEY`: (generate a strong random secret)
   - `RAZORPAY_KEY_ID`: Your Razorpay Test Key ID (e.g. `rzp_test_...`)
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Test Key Secret
   - `FLASK_ENV`: `production`

---

## 📂 Project Structure

```text
├── app.py                  # Flask entry point & API endpoints
├── requirements.txt        # Production Python dependencies
├── package.json            # Node.js dependencies & scripts
├── vite.config.js          # Vite configuration
├── .gitignore              # Git ignore rules for secrets and temp data
├── .env.example            # Template for environment variables
├── dist/                   # Compiled frontend assets
├── public/                 # Static assets & images
├── src/                    # React frontend source code
│   ├── components/         # Reusable UI components
│   ├── context/            # Global Cart and Auth contexts
│   ├── pages/              # Route pages (Home, Checkout, Orders, etc.)
│   └── index.css           # Design system styles
└── server/
    └── data/
        ├── seed.json       # Initial product catalog & admin credentials
        └── gharva.json     # Local runtime database (ignored in git)
```

---

## 📄 License

MIT License. Designed and developed for SMARTIFY.
