// src/components/CategoryBar.jsx
// SMARTIFY - Quick-Commerce Horizontally Scrollable Category Bar
import React from 'react';

const CATEGORIES = [
  { id: 'all', name: 'All Smart Essentials', icon: '⚡', slug: '' },
  { id: 'deals', name: 'Flash Deals', icon: '🔥', slug: 'deals' },
  { id: 'lighting', name: 'Smart Lighting', icon: '💡', slug: 'smart-lighting' },
  { id: 'plugs', name: 'Plugs & Switches', icon: '🔌', slug: 'smart-plugs' },
  { id: 'security', name: 'Home Security', icon: '📷', slug: 'home-security' },
  { id: 'locks', name: 'Smart Locks', icon: '🔐', slug: 'smart-locks' },
  { id: 'sensors', name: 'Sensors & Automation', icon: '🌡️', slug: 'smart-sensors' },
  { id: 'control', name: 'Smart Hubs & Remote', icon: '🎛️', slug: 'smart-control' },
  { id: 'audio', name: 'Speakers & TV', icon: '🔊', slug: 'smart-entertainment' },
  { id: 'combos', name: 'Combo Starter Kits', icon: '📦', slug: 'smart-home-combos' }
];

export default function CategoryBar({ activeCategory, onSelectCategory }) {
  return (
    <nav className="qc-category-bar" aria-label="Smart Home Categories">
      <div className="qc-category-scroll">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              className={`qc-category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.slug)}
            >
              <span className="qc-category-icon">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
