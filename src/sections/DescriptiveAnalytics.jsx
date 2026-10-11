import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import DataTable from '../components/DataTable';
import {
  CATEGORY_SALES,
  PET_TYPE_DISTRIBUTION,
  MONTHLY_REVENUE_TREND,
  BEST_SELLING_PRODUCTS
} from '../data/salesData';
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Filter,
  CheckCircle,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

// Custom Tooltip for Recharts
function CustomChartTooltip({ active, payload, label, prefix = '₹' }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-slate-900/95 text-white shadow-xl border border-slate-700 text-xs backdrop-blur-md">
        <p className="font-semibold text-slate-300 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-black text-brand-400">
          {prefix}{payload[0].value.toLocaleString('en-IN')}
        </p>
        {payload[0].payload.growth && (
          <p className="text-[10px] text-emerald-400 mt-0.5">
            Growth: {payload[0].payload.growth}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function DescriptiveAnalytics() {
  const [selectedPetFilter, setSelectedPetFilter] = useState('All');

  // Filter Best Selling Products based on pet filter
  const filteredProducts = useMemo(() => {
    if (selectedPetFilter === 'All') return BEST_SELLING_PRODUCTS;
    return BEST_SELLING_PRODUCTS.filter((p) => p.petType === selectedPetFilter);
  }, [selectedPetFilter]);

  // Table Columns
  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.id} • {row.category}</span>
        </div>
      )
    },
    {
      key: 'petType',
      label: 'Pet Division',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {val}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Retail Price',
      render: (val) => <span className="font-semibold">₹{val.toLocaleString('en-IN')}</span>
    },
    {
      key: 'unitsSold',
      label: 'Units Sold',
      render: (val) => <span className="font-bold text-slate-700 dark:text-slate-200">{val}</span>
    },
    {
      key: 'revenue',
      label: 'Gross Revenue',
      render: (val) => (
        <span className="font-black text-brand-600 dark:text-brand-400">
          ₹{val.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      key: 'growth',
      label: 'MoM Growth',
      render: (val) => (
        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" /> {val}
        </span>
      )
    },
    {
      key: 'rating',
      label: 'Score',
      render: (val) => (
        <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
          ★ {val}
        </span>
      )
    }
  ];

  return (
    <section id="descriptive" className="scroll-mt-24 py-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
              Descriptive Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Category & Pet-Wise Sales Performance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historical transaction patterns, category volume, and high-velocity SKUs across divisions
          </p>
        </div>

        {/* Pet Type Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1 p-1 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          {['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Small Animals'].map((pet) => (
            <button
              key={pet}
              onClick={() => setSelectedPetFilter(pet)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedPetFilter === pet
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
              }`}
            >
              {pet}
            </button>
          ))}
        </div>
      </div>

      {/* Top Charts Row: Category Bar & Pet Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Revenue by Product Category (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue by Product Category
              </h3>
              <p className="text-xs text-slate-400">Total gross turnover in INR across major departments</p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-xl">
              Leader: Pet Food (37.8%)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_SALES} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip content={<CustomChartTooltip prefix="₹" />} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {CATEGORY_SALES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pet Type Sales Distribution Donut (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pet-Wise Sales Distribution
                </h3>
                <p className="text-xs text-slate-400">Market share split across animal segments</p>
              </div>
              <PieIcon className="w-5 h-5 text-brand-500" />
            </div>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomChartTooltip prefix="₹" />} />
                  <Pie
                    data={PET_TYPE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {PET_TYPE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-400 font-medium">Dog Dominance</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">46.0%</span>
              </div>
            </div>
          </div>

          {/* Donut Legend Pills */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {PET_TYPE_DISTRIBUTION.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-white ml-auto">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle: Monthly Revenue Growth Area Chart */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              12-Month Gross Revenue & Order Volume Velocity
            </h3>
            <p className="text-xs text-slate-400">Monthly trajectory showing consistent upward trend from ₹9.4L to ₹12.8L</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-brand-500" /> Revenue (INR)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_REVENUE_TREND} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="areaRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val / 100000}L`} />
              <Tooltip content={<CustomChartTooltip prefix="₹" />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#areaRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Best-Selling Products Sortable Table */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Best-Selling Product Rankings
            </h3>
            <p className="text-xs text-slate-400">
              Interactive sortable table filtered by: <strong className="text-brand-600 dark:text-brand-400">{selectedPetFilter}</strong>
            </p>
          </div>
        </div>

        <DataTable
          data={filteredProducts}
          columns={columns}
          initialSortKey="revenue"
          searchPlaceholder="Search product by title, category, or SKU..."
          pageSize={5}
        />
      </div>
    </section>
  );
}
