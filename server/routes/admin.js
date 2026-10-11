// server/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require admin authentication
router.use(authenticate, requireAdmin);

// 1. Dashboard Metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = db.getMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin metrics.' });
  }
});

// 2. All Products (including inactive)
router.get('/products', (req, res) => {
  try {
    const all = db.getProducts({ is_active: undefined });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// 3. Create Product
router.post('/products', (req, res) => {
  try {
    const {
      brand,
      model,
      product_name,
      category_slug,
      mrp,
      selling_price,
      stock,
      description,
      image_url,
      sku,
      compatibility,
      price_source = 'admin'
    } = req.body;

    if (!brand || !product_name || !category_slug || !mrp || !selling_price) {
      return res.status(400).json({ error: 'Please provide all mandatory product fields.' });
    }

    const numMrp = Number(mrp);
    const numPrice = Number(selling_price);

    if (numMrp <= 0 || numPrice <= 0) {
      return res.status(400).json({ error: 'MRP and Selling Price must be greater than zero.' });
    }

    if (numPrice > numMrp) {
      return res.status(400).json({ error: 'Selling price cannot exceed MRP.' });
    }

    const product = db.createProduct({
      brand,
      model: model || brand,
      product_name,
      category_slug,
      mrp: numMrp,
      selling_price: numPrice,
      stock: parseInt(stock, 10) || 0,
      description: description || 'Smart home device',
      image_url: image_url || 'https://images.unsplash.com/photo-1550524514-9b6928780e36?auto=format&fit=crop&w=800&q=80',
      sku: sku || undefined,
      compatibility: compatibility || 'Alexa, Google Assistant, Smart Life',
      price_source
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// 4. Update Product Details
router.put('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    updates.changed_by = req.user.full_name;

    if (updates.mrp && updates.selling_price && Number(updates.selling_price) > Number(updates.mrp)) {
      return res.status(400).json({ error: 'Selling price cannot exceed MRP.' });
    }

    const updated = db.updateProduct(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// 5. Update Price & Log History Specifically
router.post('/products/:id/price', (req, res) => {
  try {
    const { id } = req.params;
    const { mrp, selling_price, price_source = 'admin' } = req.body;

    const numMrp = Number(mrp);
    const numPrice = Number(selling_price);

    if (numMrp <= 0 || numPrice <= 0) {
      return res.status(400).json({ error: 'Invalid price values.' });
    }

    if (numPrice > numMrp) {
      return res.status(400).json({ error: 'Selling price cannot exceed MRP.' });
    }

    const updated = db.updateProduct(id, {
      mrp: numMrp,
      selling_price: numPrice,
      price_source,
      changed_by: req.user.full_name
    });

    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({
      message: 'Price updated successfully and logged in audit history.',
      product: updated
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update price.' });
  }
});

// 6. Price History Audit Log
router.get('/price-history', (req, res) => {
  try {
    const { product_id } = req.query;
    const history = db.getPriceHistory(product_id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price history.' });
  }
});

// 7. All Orders Management
router.get('/orders', (req, res) => {
  try {
    const orders = db.getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// 8. Update Order Status
router.put('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;

    const validStatuses = ['Pending Payment', 'Pending Verification', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ error: 'Invalid order status.' });
    }

    const updated = db.updateOrder(id, { order_status });
    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// 8b. Manual Verification for Direct UPI Payments
router.post('/orders/:id/verify-upi', (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'approve', notes = '' } = req.body;

    const order = db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (action === 'approve') {
      // Idempotency: if already captured, return early
      if (order.payment_status === 'captured') {
        return res.json({
          success: true,
          message: 'Payment was already verified and captured.',
          order
        });
      }

      const updated = db.updateOrder(order.id, {
        payment_status: 'captured',
        order_status: 'Processing',
        verified_by: req.user.full_name || 'Admin',
        verified_at: new Date().toISOString(),
        admin_notes: notes || 'Direct UPI payment manually verified against bank statement'
      });

      // Safely deduct inventory stock if not already deducted
      if (!order.stock_deducted) {
        db.deductInventory(order.items);
        db.updateOrder(order.id, { stock_deducted: true });
      }

      return res.json({
        success: true,
        message: `Order ${updated.order_number} verified and marked as Paid/Processing.`,
        order: updated
      });
    } else if (action === 'reject') {
      const updated = db.updateOrder(order.id, {
        payment_status: 'failed',
        order_status: 'Cancelled',
        verified_by: req.user.full_name || 'Admin',
        verified_at: new Date().toISOString(),
        admin_notes: notes || 'Direct UPI UTR could not be verified with bank'
      });

      return res.json({
        success: true,
        message: `Order ${updated.order_number} Direct UPI payment rejected.`,
        order: updated
      });
    } else {
      return res.status(400).json({ error: 'Invalid action. Expected "approve" or "reject".' });
    }
  } catch (err) {
    console.error('Error verifying direct UPI payment:', err);
    res.status(500).json({ error: 'Failed to update UPI payment verification.' });
  }
});

// 9. CSV Product Import
router.post('/csv-import', (req, res) => {
  try {
    const { csv_data, preview_only = false } = req.body;
    if (!csv_data || typeof csv_data !== 'string') {
      return res.status(400).json({ error: 'Please provide CSV data string.' });
    }

    const lines = csv_data.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must contain a header row and at least one data row.' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['brand', 'product_name', 'category', 'mrp', 'selling_price', 'stock'];
    for (const reqH of requiredHeaders) {
      if (!headers.includes(reqH)) {
        return res.status(400).json({
          error: `Missing required CSV column header: "${reqH}". Expected headers: brand, product_name, model, category, mrp, selling_price, stock, description, image_url, sku`
        });
      }
    }

    const parsedRecords = [];
    const validationErrors = [];

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const values = lines[i].split(',').map(v => v.trim());
      
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const brand = row.brand;
      const productName = row.product_name;
      const model = row.model || brand;
      const categorySlug = row.category.toLowerCase().replace(/\s+/g, '-');
      const mrp = Number(row.mrp);
      const sellingPrice = Number(row.selling_price);
      const stock = parseInt(row.stock, 10);
      const sku = row.sku || `GH-CSV-${Date.now()}-${i}`;
      const description = row.description || `${brand} ${productName} for smart living`;
      const imageUrl = row.image_url || 'https://images.unsplash.com/photo-1550524514-9b6928780e36?auto=format&fit=crop&w=800&q=80';

      // Validation
      if (!brand || !productName) {
        validationErrors.push(`Row ${lineNum}: Brand and Product Name are mandatory.`);
        continue;
      }
      if (isNaN(mrp) || mrp <= 0) {
        validationErrors.push(`Row ${lineNum}: MRP must be a positive number (got "${row.mrp}").`);
        continue;
      }
      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        validationErrors.push(`Row ${lineNum}: Selling Price must be a positive number (got "${row.selling_price}").`);
        continue;
      }
      if (sellingPrice > mrp) {
        validationErrors.push(`Row ${lineNum}: Selling Price (₹${sellingPrice}) cannot exceed MRP (₹${mrp}).`);
        continue;
      }
      if (isNaN(stock) || stock < 0) {
        validationErrors.push(`Row ${lineNum}: Stock must be 0 or greater.`);
        continue;
      }

      parsedRecords.push({
        brand,
        model,
        product_name: productName,
        category_slug: categorySlug,
        mrp,
        selling_price: sellingPrice,
        stock,
        sku,
        description,
        image_url: imageUrl,
        price_source: 'admin'
      });
    }

    if (preview_only) {
      return res.json({
        total_rows: lines.length - 1,
        valid_count: parsedRecords.length,
        invalid_count: validationErrors.length,
        errors: validationErrors,
        preview_records: parsedRecords.slice(0, 5)
      });
    }

    if (parsedRecords.length === 0) {
      return res.status(400).json({
        error: 'No valid records found in CSV to import.',
        errors: validationErrors
      });
    }

    // Insert valid records
    const inserted = [];
    for (const record of parsedRecords) {
      const created = db.createProduct(record);
      inserted.push(created);
    }

    res.json({
      message: `Successfully imported ${inserted.length} products.`,
      imported_count: inserted.length,
      errors: validationErrors,
      products: inserted
    });
  } catch (err) {
    console.error('CSV Import error:', err);
    res.status(500).json({ error: 'Failed to process CSV import.' });
  }
});

module.exports = router;
