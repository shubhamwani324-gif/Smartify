// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  IndianRupee,
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  RefreshCw,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveProductImage } from '../utils/productImages';

export default function AdminDashboardPage({ onBackToStore }) {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, prices, history, orders, csv
  const [metrics, setMetrics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search in admin
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [priceModalProduct, setPriceModalProduct] = useState(null);

  // Form states for Price update
  const [newMrp, setNewMrp] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [priceSource, setPriceSource] = useState('admin');
  const [priceUpdateMsg, setPriceUpdateMsg] = useState(null);

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState(null);

  // Load all admin data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [m, p, o, ph, c] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getPriceHistory(),
        api.getCategories()
      ]);
      setMetrics(m);
      setProducts(p);
      setOrders(o);
      setPriceHistory(ph);
      setCategories(c);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="main-content" style={{ maxWidth: '500px', marginTop: '3rem', textAlign: 'center' }}>
        <div className="empty-state-box" style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)' }}>
          <ShieldCheck size={48} color="var(--color-danger)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 className="empty-state-title">Admin Access Required</h2>
          <p className="empty-state-sub">
            Aapke paas admin privileges nahi hain. Please admin credentials se login karein.
          </p>
          <button type="button" className="btn-primary" onClick={onBackToStore}>
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  // Handle Price Edit Trigger
  const openPriceModal = (product) => {
    setPriceModalProduct(product);
    setNewMrp(product.mrp);
    setNewPrice(product.selling_price);
    setPriceSource(product.price_source || 'admin');
    setPriceUpdateMsg(null);
  };

  // Submit Price Update
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!priceModalProduct) return;

    try {
      await api.updateAdminPrice(priceModalProduct.id, {
        mrp: Number(newMrp),
        selling_price: Number(newPrice),
        price_source: priceSource
      });
      setPriceUpdateMsg({ type: 'success', text: 'Price updated and logged in audit history!' });
      setTimeout(() => {
        setPriceModalProduct(null);
        loadAdminData();
      }, 800);
    } catch (err) {
      setPriceUpdateMsg({ type: 'error', text: err.message || 'Price update failed.' });
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateAdminOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Verify Direct UPI Payment
  const handleVerifyDirectUpi = async (orderId, action) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const confirmMsg = action === 'approve'
      ? `Are you sure you have verified the incoming credit of ₹${targetOrder?.total || ''} against your bank statement for ${targetOrder?.order_number || orderId}? This will mark the order as Captured/Processing and deduct stock.`
      : 'Are you sure you want to reject this Direct UPI payment and cancel the order?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.adminVerifyUpi(orderId, {
        action,
        verified_amount: targetOrder ? targetOrder.total : undefined,
        bank_reference: targetOrder?.upi_utr || 'Bank Verified'
      });
      if (res.order) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.order : o));
      } else {
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to verify UPI: ' + err.message);
    }
  };

  // CSV Preview & Import
  const handlePreviewCSV = async () => {
    if (!csvText.trim()) return;
    setCsvLoading(true);
    setCsvFeedback(null);
    try {
      const res = await api.importAdminCSV(csvText, true);
      setCsvPreview(res);
    } catch (err) {
      setCsvFeedback({ type: 'error', text: err.message });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExecuteCSVImport = async () => {
    if (!csvText.trim()) return;
    setCsvLoading(true);
    setCsvFeedback(null);
    try {
      const res = await api.importAdminCSV(csvText, false);
      setCsvFeedback({ type: 'success', text: res.message });
      setCsvText('');
      setCsvPreview(null);
      loadAdminData();
    } catch (err) {
      setCsvFeedback({ type: 'error', text: err.message });
    } finally {
      setCsvLoading(false);
    }
  };

  // Toggle Product Active / Deactivate
  const handleToggleActive = async (product) => {
    try {
      await api.updateAdminProduct(product.id, { is_active: !product.is_active });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    } catch (err) {
      alert('Failed to update product state.');
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content" style={{ maxWidth: '1320px' }}>
      {/* Top Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}
          >
            <ArrowLeft size={16} /> Return to Store (दुकान पर वापस जाएं)
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-charcoal-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={28} color="#059669" /> SMARTIFY Admin Control Center
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-500)' }}>
            Logged in as <strong>{user.full_name}</strong> ({user.email})
          </span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadAdminData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} /> Refresh Telemetry
        </button>
      </div>

      {/* Admin KPI Metrics Cards */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-charcoal-500)', textTransform: 'uppercase' }}>Gross Revenue</span>
              <div style={{ background: '#ecfdf5', padding: '0.35rem', borderRadius: '50%', color: '#059669' }}>
                <IndianRupee size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-charcoal-900)' }}>
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
              {metrics.paidOrders} Captured Payments
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-charcoal-500)', textTransform: 'uppercase' }}>Total Orders</span>
              <div style={{ background: '#f0fdf4', padding: '0.35rem', borderRadius: '50%', color: '#16a34a' }}>
                <Package size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-charcoal-900)' }}>
              {metrics.totalOrders}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-500)', marginTop: '0.2rem' }}>
              {metrics.pendingPayments} Pending Checkout
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-charcoal-500)', textTransform: 'uppercase' }}>Active Products</span>
              <div style={{ background: '#eff6ff', padding: '0.35rem', borderRadius: '50%', color: '#3b82f6' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-charcoal-900)' }}>
              {metrics.activeProducts} / {metrics.totalProducts}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-500)', marginTop: '0.2rem' }}>
              Across {categories.length} Categories
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-charcoal-500)', textTransform: 'uppercase' }}>Low Stock Alert</span>
              <div style={{ background: '#fef2f2', padding: '0.35rem', borderRadius: '50%', color: '#dc2626' }}>
                <AlertTriangle size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: metrics.lowStockProducts > 0 ? '#dc2626' : 'var(--color-charcoal-900)' }}>
              {metrics.lowStockProducts}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-500)', marginTop: '0.2rem' }}>
              {metrics.outOfStockProducts} Out of stock
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-charcoal-200)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: '📊 Products Inventory' },
          { id: 'prices', label: '🏷️ Price & Discounts' },
          { id: 'history', label: '📜 Price Audit Log' },
          { id: 'orders', label: '📦 Orders & Fulfillment' },
          { id: 'csv', label: '📥 CSV Product Import' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-charcoal-600)',
              borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PRODUCT INVENTORY MANAGEMENT */}
      {activeTab === 'overview' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <Search size={16} color="var(--color-charcoal-400)" />
              <input
                type="text"
                placeholder="Search products by title, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsAddProductOpen(true)}
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            >
              <Plus size={15} /> Add New Product
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-charcoal-200)', color: 'var(--color-charcoal-600)' }}>
                  <th style={{ padding: '0.65rem' }}>Product</th>
                  <th style={{ padding: '0.65rem' }}>Category</th>
                  <th style={{ padding: '0.65rem' }}>MRP</th>
                  <th style={{ padding: '0.65rem' }}>Selling Price</th>
                  <th style={{ padding: '0.65rem' }}>Discount</th>
                  <th style={{ padding: '0.65rem' }}>Stock</th>
                  <th style={{ padding: '0.65rem' }}>Status</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-charcoal-100)' }}>
                    <td style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <img src={resolveProductImage(p.id, p.image_url)} alt="" style={{ width: '38px', height: '38px', objectFit: 'contain', padding: '2px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.product_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-charcoal-500)' }}>{p.brand} • SKU: {p.sku}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--color-charcoal-700)' }}>{p.category_slug}</td>
                    <td style={{ padding: '0.65rem', color: 'var(--color-charcoal-500)', textDecoration: 'line-through' }}>₹{p.mrp}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 800 }}>₹{p.selling_price}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className="discount-badge">{p.discount_percentage}% OFF</span>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span style={{ fontWeight: 700, color: p.stock <= 5 ? 'var(--color-danger)' : 'var(--color-charcoal-800)' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#15803d' : '#b91c1c' }}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openPriceModal(p)}
                        style={{ padding: '0.3rem 0.6rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px', marginRight: '0.4rem', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Price
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        style={{ padding: '0.3rem 0.6rem', background: '#f1f5f9', color: 'var(--color-charcoal-700)', borderRadius: '4px', fontSize: '0.75rem' }}
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRICE & DISCOUNT MANAGEMENT */}
      {activeTab === 'prices' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Official Price & Discount Manager</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-600)' }}>
              All prices shown in Indian Rupees (₹ INR). Discounts are dynamically computed: <code>((MRP - Selling) / MRP) × 100</code>. Price updates create permanent audit history records.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-charcoal-200)' }}>
                  <th style={{ padding: '0.65rem' }}>Product & Brand</th>
                  <th style={{ padding: '0.65rem' }}>MRP</th>
                  <th style={{ padding: '0.65rem' }}>Selling Price</th>
                  <th style={{ padding: '0.65rem' }}>Calculated Discount</th>
                  <th style={{ padding: '0.65rem' }}>Price Source</th>
                  <th style={{ padding: '0.65rem' }}>Last Updated</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-charcoal-100)' }}>
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ fontWeight: 700 }}>{p.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-charcoal-500)' }}>Brand: {p.brand}</div>
                    </td>
                    <td style={{ padding: '0.65rem' }}>₹{p.mrp.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 800, color: 'var(--color-charcoal-900)' }}>
                      ₹{p.selling_price.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className="discount-badge">{p.discount_percentage}% OFF</span>
                    </td>
                    <td style={{ padding: '0.65rem' }}>
                      <span style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                        {p.price_source || 'admin'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--color-charcoal-500)', fontSize: '0.75rem' }}>
                      {new Date(p.last_price_updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => openPriceModal(p)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        Edit Price
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRICE AUDIT LOG */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Price Change Audit Trail</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-600)', marginBottom: '1rem' }}>
            Permanent record of all price adjustments to prevent arbitrary price manipulation.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-charcoal-200)' }}>
                  <th style={{ padding: '0.65rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem' }}>Product ID</th>
                  <th style={{ padding: '0.65rem' }}>Old Price</th>
                  <th style={{ padding: '0.65rem' }}>New Price</th>
                  <th style={{ padding: '0.65rem' }}>Old MRP</th>
                  <th style={{ padding: '0.65rem' }}>New MRP</th>
                  <th style={{ padding: '0.65rem' }}>Source / Author</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((ph) => (
                  <tr key={ph.id} style={{ borderBottom: '1px solid var(--color-charcoal-100)' }}>
                    <td style={{ padding: '0.65rem', color: 'var(--color-charcoal-600)' }}>
                      {new Date(ph.changed_at).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.65rem', fontFamily: 'monospace' }}>{ph.product_id}</td>
                    <td style={{ padding: '0.65rem', textDecoration: 'line-through' }}>₹{ph.old_price}</td>
                    <td style={{ padding: '0.65rem', fontWeight: 800, color: '#15803d' }}>₹{ph.new_price}</td>
                    <td style={{ padding: '0.65rem' }}>₹{ph.old_mrp || '-'}</td>
                    <td style={{ padding: '0.65rem' }}>₹{ph.new_mrp || '-'}</td>
                    <td style={{ padding: '0.65rem' }}>{ph.changed_by || ph.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS & FULFILLMENT */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Order Management ({orders.length} orders)</h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-charcoal-200)' }}>
                  <th style={{ padding: '0.65rem' }}>Order #</th>
                  <th style={{ padding: '0.65rem' }}>Customer</th>
                  <th style={{ padding: '0.65rem' }}>Items</th>
                  <th style={{ padding: '0.65rem' }}>Total (₹)</th>
                  <th style={{ padding: '0.65rem' }}>Payment & UTR</th>
                  <th style={{ padding: '0.65rem' }}>Fulfillment Status</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>Actions / Verification</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--color-charcoal-100)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 800 }}>{ord.order_number}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <div>{ord.customer_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-charcoal-500)' }}>{ord.shipping_address?.city} ({ord.shipping_address?.pincode})</div>
                    </td>
                    <td style={{ padding: '0.65rem' }}>{ord.items?.length || 0} items</td>
                    <td style={{ padding: '0.65rem', fontWeight: 800 }}>₹{ord.total.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: ord.payment_status === 'captured' ? '#dcfce7' : ord.payment_status === 'pending_verification' ? '#fef3c7' : '#fee2e2', color: ord.payment_status === 'captured' ? '#15803d' : ord.payment_status === 'pending_verification' ? '#b45309' : '#b91c1c' }}>
                          {ord.payment_method === 'direct_upi' ? 'Direct UPI' : 'Razorpay'}: {ord.payment_status}
                        </span>
                        {ord.upi_utr && (
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-charcoal-700)' }}>
                            UTR: <strong>{ord.upi_utr}</strong>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem', fontWeight: 700 }}>
                      <span style={{ fontSize: '0.78rem', color: ord.order_status === 'Processing' ? '#0369a1' : ord.order_status === 'Delivered' ? '#15803d' : 'var(--color-charcoal-700)' }}>
                        {ord.order_status}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {(ord.payment_method === 'direct_upi' || ord.payment_method === 'upi' || !ord.payment_method) && (ord.payment_status === 'pending_verification' || ord.payment_status === 'pending') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyDirectUpi(ord.id, 'approve')}
                              style={{ padding: '0.3rem 0.6rem', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                              title="Mark verified against bank statement"
                            >
                              Verify & Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyDirectUpi(ord.id, 'reject')}
                              style={{ padding: '0.3rem 0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '4px', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                              title="Reject invalid transaction"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <select
                          value={ord.order_status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          style={{ padding: '0.3rem 0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-charcoal-300)', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Paid">Paid</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CSV PRODUCT IMPORT */}
      {activeTab === 'csv' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>Bulk CSV Product Import</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-600)', marginBottom: '1rem' }}>
            Import multiple smart devices at once. Fields required: <code>brand, product_name, model, category, mrp, selling_price, stock, description, image_url, sku</code>
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <textarea
              rows={8}
              placeholder={`brand,product_name,model,category,mrp,selling_price,stock,description,image_url,sku\nPhilips,Wiz Color 9W,WIZ-9W,smart-lighting,999,649,25,Smart RGB LED Bulb,https://images.unsplash.com/photo-1550524514-9b6928780e36,PHI-CSV-01`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.82rem', border: '1px solid var(--color-charcoal-300)', borderRadius: 'var(--radius-md)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePreviewCSV}
              disabled={csvLoading || !csvText.trim()}
            >
              Validate & Preview
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExecuteCSVImport}
              disabled={csvLoading || !csvText.trim()}
            >
              Execute Import to Database
            </button>
          </div>

          {csvFeedback && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', backgroundColor: csvFeedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: csvFeedback.type === 'success' ? '#15803d' : '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>
              {csvFeedback.text}
            </div>
          )}

          {csvPreview && (
            <div style={{ border: '1px solid var(--color-charcoal-200)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: '#f8fafc' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Preview: {csvPreview.valid_count} Valid rows, {csvPreview.invalid_count} Errors
              </h4>
              {csvPreview.errors?.length > 0 && (
                <div style={{ color: '#b91c1c', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                  {csvPreview.errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem' }}>Brand</th>
                      <th style={{ padding: '0.4rem' }}>Product Name</th>
                      <th style={{ padding: '0.4rem' }}>MRP</th>
                      <th style={{ padding: '0.4rem' }}>Selling Price</th>
                      <th style={{ padding: '0.4rem' }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.preview_records?.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.4rem' }}>{r.brand}</td>
                        <td style={{ padding: '0.4rem' }}>{r.product_name}</td>
                        <td style={{ padding: '0.4rem' }}>₹{r.mrp}</td>
                        <td style={{ padding: '0.4rem', fontWeight: 700 }}>₹{r.selling_price}</td>
                        <td style={{ padding: '0.4rem' }}>{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT PRICE MODAL */}
      {priceModalProduct && (
        <div className="modal-overlay" onClick={() => setPriceModalProduct(null)}>
          <div className="modal-content-card" style={{ maxWidth: '420px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Update Product Pricing
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-600)', marginBottom: '1rem' }}>
              {priceModalProduct.product_name}
            </p>

            {priceUpdateMsg && (
              <div style={{ padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.82rem', backgroundColor: priceUpdateMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: priceUpdateMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
                {priceUpdateMsg.text}
              </div>
            )}

            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>MRP (₹)</label>
                <input
                  type="number"
                  value={newMrp}
                  onChange={(e) => setNewMrp(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-charcoal-300)', borderRadius: '4px', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Selling Price (₹)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-charcoal-300)', borderRadius: '4px', fontSize: '0.9rem' }}
                  required
                />
              </div>

              {Number(newMrp) > 0 && Number(newPrice) > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '0.5rem', borderRadius: '4px', fontSize: '0.82rem', color: '#15803d', fontWeight: 700 }}>
                  Dynamic Discount: {Math.max(0, Math.round(((Number(newMrp) - Number(newPrice)) / Number(newMrp)) * 100))}% OFF
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Price Source</label>
                <select
                  value={priceSource}
                  onChange={(e) => setPriceSource(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-charcoal-300)', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  <option value="admin">admin</option>
                  <option value="official_catalog">official_catalog</option>
                  <option value="approved_api">approved_api</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setPriceModalProduct(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save & Log History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="modal-overlay" onClick={() => setIsAddProductOpen(false)}>
          <div className="modal-content-card" style={{ maxWidth: '540px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              Add New Smart Product
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              try {
                await api.createAdminProduct({
                  brand: fd.get('brand'),
                  model: fd.get('model'),
                  product_name: fd.get('product_name'),
                  category_slug: fd.get('category_slug'),
                  mrp: Number(fd.get('mrp')),
                  selling_price: Number(fd.get('selling_price')),
                  stock: Number(fd.get('stock')),
                  description: fd.get('description'),
                  image_url: fd.get('image_url') || 'https://images.unsplash.com/photo-1550524514-9b6928780e36?auto=format&fit=crop&w=800&q=80'
                });
                setIsAddProductOpen(false);
                loadAdminData();
              } catch (err) {
                alert('Failed to add product: ' + err.message);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Brand</label>
                  <input name="brand" placeholder="e.g. Philips" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Model</label>
                  <input name="model" placeholder="e.g. Wiz 9W B22" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Product Name</label>
                <input name="product_name" placeholder="Full descriptive product title" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Category</label>
                <select name="category_slug" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>MRP (₹)</label>
                  <input name="mrp" type="number" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Selling Price (₹)</label>
                  <input name="selling_price" type="number" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Initial Stock</label>
                  <input name="stock" type="number" defaultValue="25" required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Description</label>
                <textarea name="description" rows={3} required style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddProductOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
