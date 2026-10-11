import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, PackageCheck, Truck, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';
import { calculateRestockRecommendation } from '../data/productData';

export default function ProductRecommendationDrawer({ item, isOpen, onClose }) {
  if (!isOpen || !item) return null;

  const [bufferPercent, setBufferPercent] = useState(item.bufferPercent || 15);
  const [poSubmitted, setPoSubmitted] = useState(false);

  const calc = calculateRestockRecommendation(item, bufferPercent / 100);

  const handleCreatePO = () => {
    setPoSubmitted(true);
    setTimeout(() => {
      setPoSubmitted(false);
      onClose();
    }, 1800);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200';
      case 'Low Stock':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
      case 'Overstocked':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel bg-white/95 dark:bg-slate-900/95 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(item.stockStatus)}`}>
                  {item.stockStatus} Priority
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {item.id} • Category: {item.category}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inventory Status Grid */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Current Stock</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {item.currentStock} units
                </div>
                <span className="text-[10px] text-slate-500">
                  {item.daysUntilDepletion} days until empty
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Est. 30D Demand</span>
                <div className="text-xl font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {item.estimatedDemand} units
                </div>
                <span className="text-[10px] text-slate-500">
                  Burn rate: {item.burnRateDaily}/day
                </span>
              </div>
            </div>

            {/* Algorithm Recommendation Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-indigo-500/5 to-mint-500/10 border border-brand-200 dark:border-brand-800/60 mb-5">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                <PackageCheck className="w-4 h-4 text-brand-600" />
                <span>Prescriptive Algorithm Calculation</span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-300">Recommended Restock:</span>
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  +{calc.recommendedQty} units
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Formula: Target Inventory ({calc.targetInventory}) = Demand ({item.estimatedDemand}) × (1 + Safety Buffer {bufferPercent}%) − Stock ({item.currentStock}).
              </p>
            </div>

            {/* Interactive Safety Buffer Adjustment */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Safety Buffer Slider
                </label>
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                  {bufferPercent}% ({calc.safetyUnits} buffer units)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Aggressive)</span>
                <span>20% (Recommended)</span>
                <span>40% (Conservative)</span>
              </div>
            </div>

            {/* Financial Impact Breakdown */}
            <div className="space-y-2 text-xs border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>Supplier:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.supplier}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Restock Cost (Wholesale):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">₹{calc.estimatedCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Projected Gross Revenue:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{calc.estimatedGrossRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Supplier Lead Time:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.leadTimeDays} business days</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            {poSubmitted ? (
              <div className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-md">
                <CheckCircle className="w-5 h-5" />
                <span>PO Draft #{item.id}-2026 Generated!</span>
              </div>
            ) : (
              <button
                onClick={handleCreatePO}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all transform active:scale-95"
              >
                <Truck className="w-4 h-4" />
                <span>Generate Restock Purchase Order</span>
              </button>
            )}
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Action updates demo state and drafts simulated vendor PO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
