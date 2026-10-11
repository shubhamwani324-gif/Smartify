// src/components/DealsSection.jsx
// SMARTIFY - Lightning Deals of the Day (Quick-Commerce Style)
import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { Flame, Tag, Layers, Sparkles, Clock } from 'lucide-react';

export default function DealsSection({ dealsData, onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('all');

  if (!dealsData) return null;

  const tabs = [
    { id: 'all', label: "🔥 All Lightning Deals", icon: Flame },
    { id: 'under499', label: 'Under ₹499', icon: Tag },
    { id: 'under999', label: 'Under ₹999', icon: Tag },
    { id: 'combos', label: '📦 Combo Kits', icon: Layers },
    { id: 'essentials', label: '⭐ Top Essentials', icon: Sparkles }
  ];

  let displayProducts = [];
  if (activeTab === 'all') {
    displayProducts = dealsData.topDiscounts || [];
  } else if (activeTab === 'under499') {
    displayProducts = dealsData.under499 || [];
  } else if (activeTab === 'under999') {
    displayProducts = dealsData.under999 || [];
  } else if (activeTab === 'combos') {
    displayProducts = dealsData.combos || [];
  } else if (activeTab === 'essentials') {
    displayProducts = dealsData.essentials || [];
  }

  if (displayProducts.length === 0) return null;

  return (
    <section className="qc-section">
      <div className="qc-section-header">
        <div className="qc-section-title-wrap">
          <h2 className="qc-section-title">
            <Flame size={24} color="#f97316" /> Lightning Deals of the Day
          </h2>
          <span className="qc-section-sub">
            Limited stock flash discounts • 10-minute instant delivery
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`qc-category-pill ${isActive ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="qc-product-grid">
        {displayProducts.map((p) => (
          <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
        ))}
      </div>
    </section>
  );
}
