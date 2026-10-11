// Frontend HTTP client connecting with the SMARTIFY Express backend
const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('smartify_token') || localStorage.getItem('gharva_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Products & Catalog
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return request(`/products?${query.toString()}`);
  },

  getProduct: (id) => request(`/products/${id}`),

  getDeals: () => request('/products/deals/highlights'),

  getCategories: () => request('/products/meta/categories'),

  getBrands: () => request('/products/meta/brands'),

  // Cart
  calculateCart: (items, coupon_code = '') => {
    return request('/cart/calculate', {
      method: 'POST',
      body: JSON.stringify({ items, coupon_code })
    });
  },

  // Authentication
  login: (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: (payload) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMe: () => request('/auth/me'),

  // Addresses
  getAddresses: () => request('/addresses'),

  addAddress: (addressData) => {
    return request('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  },

  deleteAddress: (id) => {
    return request(`/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  // Payment & Gateway Configurations
  getPaymentConfig: () => request('/payment/config'),

  createPaymentOrder: (payload) => {
    return request('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  createDirectUpiOrder: (payload) => {
    return request('/payment/create-upi-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  createUpiOrder: (payload) => {
    return request('/payment/create-upi-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  submitUpiReference: (payload) => {
    return request('/payment/submit-upi-reference', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  verifyPayment: (payload) => {
    return request('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getPaymentStatus: (orderId) => request(`/payment/status/${orderId}`),

  reportPaymentFailed: (payload) => {
    return request('/payment/failed', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Orders
  getOrders: () => request('/orders'),

  getOrder: (id) => request(`/orders/${id}`),

  // Pincode
  checkPincode: (pincode) => request(`/pincode/check/${pincode}`),

  // Wishlist
  getWishlist: () => request('/wishlist'),

  toggleWishlist: (product_id) => {
    return request('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id })
    });
  },

  // Reviews
  getReviews: (productId) => request(`/reviews/${productId}`),

  checkReviewEligibility: (productId) => request(`/reviews/eligibility/${productId}`),

  addReview: (reviewData) => {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // Admin APIs
  getAdminMetrics: () => request('/admin/metrics'),

  getAdminProducts: () => request('/admin/products'),

  createAdminProduct: (payload) => {
    return request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateAdminProduct: (id, payload) => {
    return request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  updateAdminPrice: (id, pricePayload) => {
    return request(`/admin/products/${id}/price`, {
      method: 'POST',
      body: JSON.stringify(pricePayload)
    });
  },

  getPriceHistory: (productId = null) => {
    const q = productId ? `?product_id=${productId}` : '';
    return request(`/admin/price-history${q}`);
  },

  getAdminOrders: () => request('/admin/orders'),

  updateAdminOrderStatus: (id, order_status) => {
    return request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status })
    });
  },

  importAdminCSV: (csv_data, preview_only = false) => {
    return request('/admin/csv-import', {
      method: 'POST',
      body: JSON.stringify({ csv_data, preview_only })
    });
  },

  adminVerifyUpi: (orderId, payload) => {
    return request(`/admin/orders/${orderId}/verify-upi`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
