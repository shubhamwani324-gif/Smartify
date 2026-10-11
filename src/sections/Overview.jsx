import React from 'react';
import KpiCard from '../components/KpiCard';
import { KPI_DATA } from '../data/salesData';
import { DollarSign, ShoppingBag, Package, Receipt, Calendar, ArrowUpRight } from 'lucide-react';

export default function Overview({ dateRange, setDateRange }) {
  const currentKpi = KPI_DATA[dateRange] || KPI_DATA['30d'];

  return (
    <section id="overview" className="scroll-mt-24 py-8">
      {/* Section Header with Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Overview
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Core financial and inventory throughput KPIs for the selected reporting window
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm self-start sm:self-auto">
          <span className="px-2.5 text-slate-400 text-xs font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>Range:</span>
          </span>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: '1y', label: '1 Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateRange === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Animated KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Total Revenue"
          formattedValue={currentKpi.revenue.formatted}
          change={currentKpi.revenue.change}
          isPositive={currentKpi.revenue.isPositive}
          previousPeriod={currentKpi.revenue.previousPeriod}
          sparklineData={currentKpi.revenue.sparkline}
          tooltip={currentKpi.revenue.tooltip}
          icon={DollarSign}
          gradientColor="from-purple-600 to-indigo-600"
          iconColor="text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400"
        />

        <KpiCard
          title="Total Orders"
          formattedValue={currentKpi.orders.formatted}
          change={currentKpi.orders.change}
          isPositive={currentKpi.orders.isPositive}
          previousPeriod={currentKpi.orders.previousPeriod}
          sparklineData={currentKpi.orders.sparkline}
          tooltip={currentKpi.orders.tooltip}
          icon={ShoppingBag}
          gradientColor="from-emerald-500 to-teal-600"
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400"
        />

        <KpiCard
          title="Units Sold"
          formattedValue={currentKpi.unitsSold.formatted}
          change={currentKpi.unitsSold.change}
          isPositive={currentKpi.unitsSold.isPositive}
          previousPeriod={currentKpi.unitsSold.previousPeriod}
          sparklineData={currentKpi.unitsSold.sparkline}
          tooltip={currentKpi.unitsSold.tooltip}
          icon={Package}
          gradientColor="from-blue-500 to-sky-600"
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400"
        />

        <KpiCard
          title="Average Order Value"
          formattedValue={currentKpi.avgOrderValue.formatted}
          change={currentKpi.avgOrderValue.change}
          isPositive={currentKpi.avgOrderValue.isPositive}
          previousPeriod={currentKpi.avgOrderValue.previousPeriod}
          sparklineData={currentKpi.avgOrderValue.sparkline}
          tooltip={currentKpi.avgOrderValue.tooltip}
          icon={Receipt}
          gradientColor="from-amber-500 to-orange-600"
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
        />
      </div>
    </section>
  );
}
