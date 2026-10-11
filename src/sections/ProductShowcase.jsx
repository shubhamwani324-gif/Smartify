import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import ProductRecommendationDrawer from '../components/ProductRecommendationDrawer';
import { SHOWCASE_PRODUCTS, INVENTORY_RECOMMENDATIONS } from '../data/productData';
import { Sparkles, Package, Filter, Check } from 'lucide-react';

export default function ProductShowcase() {
  const [selectedPet, setSelectedPet] = useState('All');
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (selectedPet === 'All') return SHOWCASE_PRODUCTS;
    return SHOWCASE_PRODUCTS.filter((p) => p.petType === selectedPet);
  }, [selectedPet]);

  const handleSelectProduct = (product) => {
    // Map showcase product to corresponding recommendation item
    const match = INVENTORY_RECOMMENDATIONS.find(
      (r) => r.name.toLowerCase().includes(product.shortName.toLowerCase().split(' ')[0]) || r.category === product.category
    ) || INVENTORY_RECOMMENDATIONS[0];
    setSelectedDrawerItem(match);
    setIsDrawerOpen(true);
  };

  return (
    <section id="showcase" className="scroll-mt-24 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Product Performance
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Core Retail Product Showcase
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top performing SKUs with interactive 3D visual cards, pricing telemetry, and unit margin contributions
          </p>
        </div>

        {/* Pet Division Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm self-start sm:self-auto">
          {['All', 'Dog', 'Cat', 'Bird'].map((pet) => (
            <button
              key={pet}
              onClick={() => setSelectedPet(pet)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedPet === pet
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
              }`}
            >
              {pet}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={handleSelectProduct}
          />
        ))}
      </div>

      {/* Product Detail Modal */}
      <ProductRecommendationDrawer
        item={selectedDrawerItem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </section>
  );
}
