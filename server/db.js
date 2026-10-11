// server/db.js
// GHARVA Database Layer
// Supports persistent storage, Supabase schema alignment, and price history tracking

const fs = require('fs');
const path = require('path');
const { categories, brands, products, sampleReviews, serviceablePincodes } = require('./seedData');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'gharva.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state cache backed by persistent JSON
let dbState = null;

function calculateDiscount(mrp, sellingPrice) {
  if (!mrp || mrp <= 0 || !sellingPrice || sellingPrice <= 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

function enrichProduct(product) {
  const discount_percentage = calculateDiscount(product.mrp, product.selling_price);
  const discount_amount = Math.max(0, product.mrp - product.selling_price);
  return {
    ...product,
    discount_percentage,
    discount_amount,
    currency: 'INR',
    currency_symbol: '₹',
    in_stock: product.stock > 0,
    is_low_stock: product.stock > 0 && product.stock <= 5
  };
}

function getInitialState() {
  return {
    users: [
      {
        id: "usr-admin-01",
        email: "admin@gharva.in",
        password_hash: "$2a$10$w87.Yg1ZzJ1K2W8C0u2vhe8N2Zk7L8O4yL1c3L9m8K7u2Z1vhe8N2", // admin123
        full_name: "SMARTIFY Admin",
        phone: "9876543210",
        role: "admin",
        created_at: new Date().toISOString()
      },
      {
        id: "usr-admin-02",
        email: "admin@smartify.in",
        password_hash: "$2a$10$w87.Yg1ZzJ1K2W8C0u2vhe8N2Zk7L8O4yL1c3L9m8K7u2Z1vhe8N2", // admin123
        full_name: "SMARTIFY Admin",
        phone: "9876543210",
        role: "admin",
        created_at: new Date().toISOString()
      },
      {
        id: "usr-cust-01",
        email: "rahul@gmail.com",
        password_hash: "$2a$10$w87.Yg1ZzJ1K2W8C0u2vhe8N2Zk7L8O4yL1c3L9m8K7u2Z1vhe8N2", // password123
        full_name: "Rahul Sharma",
        phone: "9811223344",
        role: "customer",
        created_at: new Date().toISOString()
      }
    ],
    categories: [...categories],
    brands: [...brands],
    products: products.map(p => ({ ...p })),
    price_history: [
      {
        id: "ph-01",
        product_id: "p-01",
        old_mrp: 999,
        new_mrp: 999,
        old_price: 699,
        new_price: 649,
        source: "admin",
        changed_by: "Gharva Admin",
        changed_at: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: "ph-02",
        product_id: "p-07",
        old_mrp: 1999,
        new_mrp: 1999,
        old_price: 1199,
        new_price: 1099,
        source: "admin",
        changed_by: "Gharva Admin",
        changed_at: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ],
    inventory_logs: [],
    addresses: [
      {
        id: "addr-01",
        user_id: "usr-cust-01",
        full_name: "Rahul Sharma",
        phone: "9811223344",
        house_flat: "Flat 402, Tower B, Palm Heights",
        street_area: "Sector 62, Near Metro Station",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        is_default: true,
        created_at: new Date().toISOString()
      }
    ],
    carts: {}, // keyed by userId or sessionId
    orders: [
      {
        id: "ord-seed-01",
        order_number: "GH-2026-000001",
        user_id: "usr-cust-01",
        customer_name: "Rahul Sharma",
        customer_email: "rahul@gmail.com",
        customer_phone: "9811223344",
        subtotal: 1398,
        discount: 100,
        delivery_fee: 0,
        total: 1298,
        coupon_applied: "WELCOME100",
        shipping_address: {
          full_name: "Rahul Sharma",
          phone: "9811223344",
          house_flat: "Flat 402, Tower B, Palm Heights",
          street_area: "Sector 62",
          city: "Noida",
          state: "Uttar Pradesh",
          pincode: "201301"
        },
        items: [
          {
            product_id: "p-01",
            product_name: "Philips Wiz Smart Wi-Fi 9W LED Bulb (B22, 16 Million Colors)",
            brand: "Philips",
            mrp: 999,
            price: 649,
            quantity: 1,
            image_url: "https://images.unsplash.com/photo-1550524514-9b6928780e36?auto=format&fit=crop&w=800&q=80"
          },
          {
            product_id: "p-03",
            product_name: "Tapo L530E Smart Wi-Fi Multicolor LED Bulb (806 Lumens)",
            brand: "TP-Link / Tapo",
            mrp: 1299,
            price: 749,
            quantity: 1,
            image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
          }
        ],
        payment_id: "pay_test_001seed",
        razorpay_order_id: "order_test_001seed",
        payment_status: "captured",
        order_status: "Delivered",
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    ],
    payments: [],
    reviews: [...sampleReviews],
    wishlist: {
      "usr-cust-01": ["p-07", "p-12"]
    },
    coupons: [
      { code: "WELCOME100", discount_type: "flat", discount_value: 100, min_order_value: 499, is_active: true },
      { code: "SMART50", discount_type: "flat", discount_value: 50, min_order_value: 299, is_active: true },
      { code: "GHARVA10", discount_type: "percentage", discount_value: 10, min_order_value: 999, is_active: true }
    ],
    pincodes: [...serviceablePincodes],
    order_counter: 2
  };
}

function loadDB() {
  if (dbState) return dbState;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      dbState = JSON.parse(data);
      // Ensure products have all latest properties if seed changed
      if (!dbState.products || dbState.products.length < products.length) {
        dbState = getInitialState();
        saveDB();
      }
    } else {
      dbState = getInitialState();
      saveDB();
    }
  } catch (err) {
    console.error("Error loading DB file, resetting to initial state:", err);
    dbState = getInitialState();
    saveDB();
  }
  return dbState;
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to DB file:", err);
  }
}

// Database Operations
const db = {
  // PRODUCTS
  getProducts: (filters = {}) => {
    const s = loadDB();
    let prods = s.products.map(enrichProduct);

    if (filters.is_active !== undefined) {
      prods = prods.filter(p => p.is_active === filters.is_active);
    } else {
      prods = prods.filter(p => p.is_active);
    }

    if (filters.category) {
      prods = prods.filter(p => p.category_slug === filters.category);
    }

    if (filters.brand) {
      prods = prods.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    if (filters.min_price) {
      prods = prods.filter(p => p.selling_price >= Number(filters.min_price));
    }

    if (filters.max_price) {
      prods = prods.filter(p => p.selling_price <= Number(filters.max_price));
    }

    if (filters.is_combo) {
      prods = prods.filter(p => p.is_combo === true);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      prods = prods.filter(p => {
        return (
          p.product_name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.compatibility && p.compatibility.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    if (filters.sort) {
      if (filters.sort === 'price_asc') {
        prods.sort((a, b) => a.selling_price - b.selling_price);
      } else if (filters.sort === 'price_desc') {
        prods.sort((a, b) => b.selling_price - a.selling_price);
      } else if (filters.sort === 'discount_desc') {
        prods.sort((a, b) => b.discount_percentage - a.discount_percentage);
      } else if (filters.sort === 'rating_desc') {
        prods.sort((a, b) => b.rating - a.rating);
      }
    }

    return prods;
  },

  getProductById: (id) => {
    const s = loadDB();
    const prod = s.products.find(p => p.id === id || p.slug === id);
    return prod ? enrichProduct(prod) : null;
  },

  createProduct: (productData) => {
    const s = loadDB();
    const id = "p-" + Date.now();
    const slug = productData.slug || productData.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newProd = {
      ...productData,
      id,
      slug,
      mrp: Number(productData.mrp),
      selling_price: Number(productData.selling_price),
      stock: Number(productData.stock || 0),
      sku: productData.sku || ("GH-" + Math.random().toString(36).substring(2, 8).toUpperCase()),
      rating: 5.0,
      review_count: 0,
      price_source: productData.price_source || "admin",
      last_price_updated: new Date().toISOString(),
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      created_at: new Date().toISOString()
    };
    s.products.unshift(newProd);
    saveDB();
    return enrichProduct(newProd);
  },

  updateProduct: (id, updates) => {
    const s = loadDB();
    const idx = s.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const current = s.products[idx];
    const oldMrp = current.mrp;
    const oldPrice = current.selling_price;

    const newMrp = updates.mrp !== undefined ? Number(updates.mrp) : current.mrp;
    const newPrice = updates.selling_price !== undefined ? Number(updates.selling_price) : current.selling_price;

    // Check if price changed -> log to price history
    if (newMrp !== oldMrp || newPrice !== oldPrice) {
      s.price_history.unshift({
        id: "ph-" + Date.now(),
        product_id: current.id,
        old_mrp: oldMrp,
        new_mrp: newMrp,
        old_price: oldPrice,
        new_price: newPrice,
        source: updates.price_source || "admin",
        changed_by: updates.changed_by || "Admin",
        changed_at: new Date().toISOString()
      });
      updates.last_price_updated = new Date().toISOString();
    }

    s.products[idx] = {
      ...current,
      ...updates,
      mrp: newMrp,
      selling_price: newPrice,
      stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
      updated_at: new Date().toISOString()
    };

    saveDB();
    return enrichProduct(s.products[idx]);
  },

  deleteProduct: (id) => {
    const s = loadDB();
    const idx = s.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    s.products[idx].is_active = false; // Soft deactivate
    saveDB();
    return true;
  },

  // PRICE HISTORY
  getPriceHistory: (productId = null) => {
    const s = loadDB();
    if (productId) {
      return s.price_history.filter(ph => ph.product_id === productId);
    }
    return s.price_history;
  },

  // CATEGORIES & BRANDS
  getCategories: () => {
    const s = loadDB();
    return s.categories;
  },

  getBrands: () => {
    const s = loadDB();
    return s.brands;
  },

  // USERS
  getUserByEmail: (email) => {
    const s = loadDB();
    return s.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById: (id) => {
    const s = loadDB();
    const user = s.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  createUser: ({ email, password_hash, full_name, phone, role = "customer" }) => {
    const s = loadDB();
    const newUser = {
      id: "usr-" + Date.now(),
      email: email.toLowerCase(),
      password_hash,
      full_name,
      phone,
      role,
      created_at: new Date().toISOString()
    };
    s.users.push(newUser);
    saveDB();
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  },

  // ADDRESSES
  getUserAddresses: (userId) => {
    const s = loadDB();
    return s.addresses.filter(a => a.user_id === userId);
  },

  addAddress: (userId, addressData) => {
    const s = loadDB();
    const newAddress = {
      id: "addr-" + Date.now(),
      user_id: userId,
      ...addressData,
      is_default: addressData.is_default || s.addresses.filter(a => a.user_id === userId).length === 0,
      created_at: new Date().toISOString()
    };
    if (newAddress.is_default) {
      s.addresses.forEach(a => {
        if (a.user_id === userId) a.is_default = false;
      });
    }
    s.addresses.push(newAddress);
    saveDB();
    return newAddress;
  },

  deleteAddress: (userId, addressId) => {
    const s = loadDB();
    const idx = s.addresses.findIndex(a => a.id === addressId && a.user_id === userId);
    if (idx === -1) return false;
    s.addresses.splice(idx, 1);
    saveDB();
    return true;
  },

  // CART
  getCart: (key) => {
    const s = loadDB();
    return s.carts[key] || [];
  },

  setCart: (key, items) => {
    const s = loadDB();
    s.carts[key] = items;
    saveDB();
    return s.carts[key];
  },

  // ORDERS
  createOrder: (orderData) => {
    const s = loadDB();
    s.order_counter = (s.order_counter || 1) + 1;
    const orderNumber = `GH-2026-${String(s.order_counter).padStart(6, '0')}`;

    const newOrder = {
      id: "ord-" + Date.now(),
      order_number: orderNumber,
      order_status: "Pending Payment",
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...orderData
    };

    s.orders.unshift(newOrder);
    saveDB();
    return newOrder;
  },

  updateOrder: (orderId, updates) => {
    const s = loadDB();
    const idx = s.orders.findIndex(o => o.id === orderId || o.razorpay_order_id === orderId);
    if (idx === -1) return null;

    s.orders[idx] = {
      ...s.orders[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveDB();
    return s.orders[idx];
  },

  getOrderById: (orderId) => {
    const s = loadDB();
    return s.orders.find(o => o.id === orderId || o.order_number === orderId || o.razorpay_order_id === orderId) || null;
  },

  getUserOrders: (userId) => {
    const s = loadDB();
    return s.orders.filter(o => o.user_id === userId);
  },

  getAllOrders: () => {
    const s = loadDB();
    return s.orders;
  },

  // DEDUCT INVENTORY
  deductInventory: (items) => {
    const s = loadDB();
    for (const item of items) {
      const prod = s.products.find(p => p.id === item.product_id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }
    }
    saveDB();
  },

  // WISHLIST
  getWishlist: (userId) => {
    const s = loadDB();
    const productIds = s.wishlist[userId] || [];
    return s.products.filter(p => productIds.includes(p.id) && p.is_active).map(enrichProduct);
  },

  toggleWishlist: (userId, productId) => {
    const s = loadDB();
    if (!s.wishlist[userId]) s.wishlist[userId] = [];
    const list = s.wishlist[userId];
    const index = list.indexOf(productId);
    let added = false;
    if (index > -1) {
      list.splice(index, 1);
      added = false;
    } else {
      list.push(productId);
      added = true;
    }
    saveDB();
    return { added, count: list.length };
  },

  // REVIEWS
  getReviewsByProduct: (productId) => {
    const s = loadDB();
    return s.reviews.filter(r => r.product_id === productId);
  },

  hasPurchasedProduct: (userId, productId) => {
    const s = loadDB();
    return s.orders.some(o => 
      o.user_id === userId &&
      (o.order_status === 'Delivered' || o.order_status === 'Paid' || o.order_status === 'Processing') &&
      o.items.some(item => item.product_id === productId)
    );
  },

  addReview: (reviewData) => {
    const s = loadDB();
    const newReview = {
      id: "rev-" + Date.now(),
      created_at: new Date().toISOString(),
      verified_purchase: true,
      ...reviewData
    };
    s.reviews.unshift(newReview);

    // Update product rating and review count
    const prodReviews = s.reviews.filter(r => r.product_id === reviewData.product_id);
    const avg = prodReviews.reduce((acc, r) => acc + r.rating, 0) / prodReviews.length;
    const prodIdx = s.products.findIndex(p => p.id === reviewData.product_id);
    if (prodIdx > -1) {
      s.products[prodIdx].rating = Number(avg.toFixed(1));
      s.products[prodIdx].review_count = prodReviews.length;
    }

    saveDB();
    return newReview;
  },

  // COUPONS
  getCoupon: (code) => {
    const s = loadDB();
    if (!code) return null;
    return s.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.is_active) || null;
  },

  // PINCODES
  checkPincode: (pincode) => {
    const s = loadDB();
    const pin = s.pincodes.find(p => p.pincode === String(pincode).trim());
    if (pin) return pin;

    // Standard fallback logic for valid 6-digit Indian pincodes
    const cleanPin = String(pincode).trim();
    if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return {
        pincode: cleanPin,
        city: "Standard Delivery Zone",
        state: "India",
        is_serviceable: true,
        estimated_days: "3-5 days"
      };
    }
    return {
      pincode: cleanPin,
      is_serviceable: false,
      message: "Currently unavailable for this location"
    };
  },

  // METRICS (Admin)
  getMetrics: () => {
    const s = loadDB();
    const totalRevenue = s.orders
      .filter(o => o.order_status !== 'Cancelled' && o.payment_status === 'captured')
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = s.orders.length;
    const paidOrders = s.orders.filter(o => o.payment_status === 'captured').length;
    const pendingPayments = s.orders.filter(o => o.payment_status === 'pending').length;
    const lowStockProducts = s.products.filter(p => p.stock <= 5 && p.is_active).length;
    const outOfStockProducts = s.products.filter(p => p.stock === 0 && p.is_active).length;

    return {
      totalRevenue,
      totalOrders,
      paidOrders,
      pendingPayments,
      totalCustomers: s.users.filter(u => u.role === 'customer').length,
      totalProducts: s.products.length,
      activeProducts: s.products.filter(p => p.is_active).length,
      lowStockProducts,
      outOfStockProducts
    };
  }
};

module.exports = db;
