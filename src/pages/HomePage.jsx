// src/pages/HomePage.jsx
// SMARTIFY - Complete Blinkit-Inspired Quick-Commerce Homepage
import React, { useState, useEffect, useMemo } from 'react';
import CompactHero from '../components/CompactHero';
import CategoryBar from '../components/CategoryBar';
import DealsSection from '../components/DealsSection';
import ProductGrid from '../components/ProductGrid';
import { api } from '../services/api';
import { Zap, Flame, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function HomePage({ onSelectProduct, onOpenCart }) {
  const [activeCategory, setActiveCategory] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [dealsData, setDealsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Load Deals Data
  useEffect(() => {
    async function loadDeals() {
      try {
        const d = await api.getDeals();
        setDealsData(d);
      } catch (err) {
        console.error('Failed to load deals:', err);
      }
    }
    loadDeals();
  }, []);

  // Load Brands
  useEffect(() => {
    async function loadBrands() {
      try {
        const b = await api.getBrands();
        setBrands(b);
      } catch (err) {
        console.error('Failed to load brands:', err);
      }
    }
    loadBrands();
  }, []);

  // Fetch Full Catalog
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const params = { limit: 40, sort: sortBy };
        if (activeCategory && activeCategory !== 'deals') {
          params.category = activeCategory;
        }
        if (selectedBrand) {
          params.brand = selectedBrand;
        }
        const res = await api.getProducts(params);
        setAllProducts(res.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [activeCategory, selectedBrand, sortBy]);

  const handleSelectCategory = (slug) => {
    setActiveCategory(slug);
    setSelectedBrand('');
  };

  const handleShopNow = () => {
    const el = document.getElementById('catalog-shelves');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Grouped Shelves for "All" Homepage view
  const bestSellers = useMemo(() => {
    return allProducts.filter(p => p.rating >= 4.5 || p.stock > 15).slice(0, 5);
  }, [allProducts]);

  const smartLighting = useMemo(() => {
    return allProducts.filter(p => p.category_slug === 'smart-lighting').slice(0, 5);
  }, [allProducts]);

  const smartPlugs = useMemo(() => {
    return allProducts.filter(p => p.category_slug === 'smart-plugs').slice(0, 5);
  }, [allProducts]);

  const homeSecurity = useMemo(() => {
    return allProducts.filter(p => p.category_slug === 'home-security' || p.category_slug === 'smart-locks').slice(0, 5);
  }, [allProducts]);

  const smartSensors = useMemo(() => {
    return allProducts.filter(p => p.category_slug === 'smart-sensors' || p.category_slug === 'smart-control').slice(0, 5);
  }, [allProducts]);

  const comboKits = useMemo(() => {
    return allProducts.filter(p => p.category_slug === 'smart-home-combos' || p.product_name?.toLowerCase().includes('kit') || p.product_name?.toLowerCase().includes('combo')).slice(0, 5);
  }, [allProducts]);

  return (
    <div>
      {/* Category Bar */}
      <CategoryBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      <div className="main-content">
        {/* Quick-Commerce Hero Banner (Shown on All view) */}
        {!activeCategory && (
          <CompactHero onShopNow={handleShopNow} />
        )}

        {/* Deals Highlights Section */}
        {(!activeCategory || activeCategory === 'deals') && dealsData && (
          <DealsSection
            dealsData={dealsData}
            onSelectProduct={onSelectProduct}
          />
        )}

        {/* Filter and Sorting Header Bar (When category is selected or searching) */}
        {activeCategory && (
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--qc-border)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'capitalize' }}>
                {activeCategory.replace('-', ' ')}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--qc-muted)' }}>
                Showing {allProducts.length} items with 10-minute instant delivery
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Brand Filter */}
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--qc-border)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: 'var(--qc-dark)'
                }}
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--qc-border)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  color: 'var(--qc-dark)'
                }}
              >
                <option value="">Sort: Featured</option>
                <option value="price_asc">Price: Low to High (₹)</option>
                <option value="price_desc">Price: High to Low (₹)</option>
                <option value="discount_desc">Highest Discount (% OFF)</option>
                <option value="rating_desc">Highest Rated (⭐)</option>
              </select>
            </div>
          </div>
        )}

        {/* Curated Shelves for Homepage */}
        <div id="catalog-shelves">
          {activeCategory ? (
            /* Specific Category Grid */
            <ProductGrid
              products={allProducts}
              loading={loading}
              onSelectProduct={onSelectProduct}
            />
          ) : (
            /* Curated Quick-Commerce Shelves */
            <>
              {/* Shelf 1: Best Sellers */}
              {bestSellers.length > 0 && (
                <ProductGrid
                  title="🌟 Best Sellers"
                  subtitle="Most trusted smart home devices in Indian households"
                  products={bestSellers}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Shelf 2: Smart Lighting */}
              {smartLighting.length > 0 && (
                <ProductGrid
                  title="💡 Smart Lighting"
                  subtitle="Wi-Fi RGB & CCT bulbs, battens, and LED ambient strips"
                  products={smartLighting}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Shelf 3: Smart Plugs & Power */}
              {smartPlugs.length > 0 && (
                <ProductGrid
                  title="🔌 Smart Plugs & Energy"
                  subtitle="High-load 16A AC/Geyser plugs & power monitoring switches"
                  products={smartPlugs}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Shelf 4: Home Security & Cameras */}
              {homeSecurity.length > 0 && (
                <ProductGrid
                  title="📷 Home Security & Surveillance"
                  subtitle="360° pan-tilt Wi-Fi cameras, video doorbells, and smart locks"
                  products={homeSecurity}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Shelf 5: Sensors & Automation */}
              {smartSensors.length > 0 && (
                <ProductGrid
                  title="🌡️ Sensors & Automation"
                  subtitle="Motion detectors, door/window sensors, and smart IR hubs"
                  products={smartSensors}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}

              {/* Shelf 6: Smart Combos & Starter Kits */}
              {comboKits.length > 0 && (
                <ProductGrid
                  title="📦 Combo Starter Kits"
                  subtitle="Curated smart room packages with maximum bundle savings"
                  products={comboKits}
                  loading={loading}
                  onSelectProduct={onSelectProduct}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
