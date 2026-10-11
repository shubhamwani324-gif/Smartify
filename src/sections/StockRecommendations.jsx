import React, { useState, useMemo } from 'react';
import DataTable from '../components/DataTable';
import ProductRecommendationDrawer from '../components/ProductRecommendationDrawer';
import {
  INVENTORY_RECOMMENDATIONS,
  calculateRestockRecommendation
} from '../data/productData';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Package,
  TrendingDown,
  ArrowRight,
  Truck,
  Filter,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

export default function StockRecommendations() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeItemForDrawer, setActiveItemForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter recommendations
  const filteredData = useMemo(() => {
    return INVENTORY_RECOMMENDATIONS.filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'All' || item.stockStatus === selectedStatus;
      return matchCategory && matchStatus;
    });
  }, [selectedCategory, selectedStatus]);

  // Aggregate metrics
  const summaryMetrics = useMemo(() => {
    const criticalCount = INVENTORY_RECOMMENDATIONS.filter(i => i.stockStatus === 'Critical').length;
    const lowStockCount = INVENTORY_RECOMMENDATIONS.filter(i => i.stockStatus === 'Low Stock').length;
    const healthyCount = INVENTORY_RECOMMENDATIONS.filter(i => i.stockStatus === 'Healthy').length;
    const overstockedCount = INVENTORY_RECOMMENDATIONS.filter(i => i.stockStatus === 'Overstocked').length;

    let totalRestockNeeded = 0;
    let totalRestockCost = 0;

    INVENTORY_RECOMMENDATIONS.forEach(item => {
      const { recommendedQty, estimatedCost } = calculateRestockRecommendation(item);
      totalRestockNeeded += recommendedQty;
      totalRestockCost += estimatedCost;
    });

    return {
      criticalCount,
      lowStockCount,
      healthyCount,
      overstockedCount,
      totalRestockNeeded,
      totalRestockCost
    };
  }, []);

  const handleOpenDetails = (item) => {
    setActiveItemForDrawer(item);
    setIsDrawerOpen(true);
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-600 text-white';
      case 'Medium':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product & SKU',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.id} • {row.category}</span>
        </div>
      )
    },
    {
      key: 'currentStock',
      label: 'Current Stock',
      render: (val, row) => (
        <div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">{val} units</span>
          <span className="text-[10px] text-slate-400 block">{row.daysUntilDepletion} days left</span>
        </div>
      )
    },
    {
      key: 'estimatedDemand',
      label: 'Est. 30D Demand',
      render: (val) => <span className="font-semibold">{val} units</span>
    },
    {
      key: 'recommendedRestock',
      label: 'Restock Rec.',
      render: (_, row) => {
        const { recommendedQty } = calculateRestockRecommendation(row);
        return (
          <span className={`font-black ${recommendedQty > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            {recommendedQty > 0 ? `+${recommendedQty} units` : '0 (Optimal)'}
          </span>
        );
      }
    },
    {
      key: 'stockStatus',
      label: 'Stock Health',
      render: (val) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(val)}`}>
          {val}
        </span>
      )
    },
    {
      key: 'priorityLevel',
      label: 'Priority',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getPriorityBadge(val)}`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => handleOpenDetails(row)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      )
    }
  ];

  return (
    <section id="prescriptive" className="scroll-mt-24 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              Prescriptive Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Automated Product Stocking Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Decision-support algorithms calculating replenishment needs based on burn rates, lead times, and safety buffers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="All">All Health Statuses</option>
            <option value="Critical">Critical</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Healthy">Healthy</option>
            <option value="Overstocked">Overstocked</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Critical Attention</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {summaryMetrics.criticalCount} SKUs
            </div>
            <span className="text-[10px] text-slate-400">Depletion in &lt; 4 days</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Restock Needed</span>
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
              +{summaryMetrics.totalRestockNeeded} Units
            </div>
            <span className="text-[10px] text-slate-400">Across high/medium priority</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Healthy Stock Level</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {summaryMetrics.healthyCount} SKUs
            </div>
            <span className="text-[10px] text-slate-400">&gt; 18 days safe coverage</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Est. PO Capital</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              ₹{(summaryMetrics.totalRestockCost / 100000).toFixed(2)}L
            </div>
            <span className="text-[10px] text-slate-400">Combined wholesale cost</span>
          </div>
        </div>
      </div>

      {/* Stock Health Distribution Visualizer */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Inventory Health Distribution
          </h3>
          <span className="text-xs text-slate-400">10 Monitored SKUs</span>
        </div>

        {/* Stacked Segment Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-3">
          <div style={{ width: `${(summaryMetrics.criticalCount / 10) * 100}%` }} className="bg-rose-500" title="Critical" />
          <div style={{ width: `${(summaryMetrics.lowStockCount / 10) * 100}%` }} className="bg-amber-500" title="Low Stock" />
          <div style={{ width: `${(summaryMetrics.healthyCount / 10) * 100}%` }} className="bg-emerald-500" title="Healthy" />
          <div style={{ width: `${(summaryMetrics.overstockedCount / 10) * 100}%` }} className="bg-sky-500" title="Overstocked" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Critical: {summaryMetrics.criticalCount} SKUs ({(summaryMetrics.criticalCount/10)*100}%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Low Stock: {summaryMetrics.lowStockCount} SKUs ({(summaryMetrics.lowStockCount/10)*100}%)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Healthy: {summaryMetrics.healthyCount} SKUs ({(summaryMetrics.healthyCount/10)*100}%)
          </span>
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            Overstocked: {summaryMetrics.overstockedCount} SKUs ({(summaryMetrics.overstockedCount/10)*100}%)
          </span>
        </div>
      </div>

      {/* Main Stocking Table */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <DataTable
          data={filteredData}
          columns={columns}
          initialSortKey="currentStock"
          initialSortDirection="asc"
          searchPlaceholder="Search inventory by product, category, or SKU..."
          pageSize={6}
        />
      </div>

      {/* Deep-Dive Recommendation Modal / Drawer */}
      <ProductRecommendationDrawer
        item={activeItemForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </section>
  );
}
