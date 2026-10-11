import React from 'react';
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
  CartesianGrid
} from 'recharts';
import InsightPanel from '../components/InsightPanel';
import {
  DAY_OF_WEEK_DEMAND,
  HOURLY_DEMAND_PATTERN,
  PRODUCT_COMBINATIONS,
  CUSTOMER_SEGMENTS,
  RETENTION_METRICS,
  getDiagnosticKeyInsights
} from '../data/customerData';
import {
  CalendarDays,
  Clock,
  Layers,
  Users,
  Repeat,
  Sparkles,
  Link2,
  TrendingUp,
  Percent
} from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs border border-slate-700">
        <p className="font-bold text-slate-300 mb-1">{payload[0].payload.fullDay || label}</p>
        <p className="text-emerald-400 font-extrabold">
          ₹{payload[0].payload.revenue.toLocaleString('en-IN')}
        </p>
        <p className="text-slate-400 text-[10px] mt-0.5">
          {payload[0].payload.orders} orders • Avg Basket: ₹{payload[0].payload.avgBasket}
        </p>
      </div>
    );
  }
  return null;
}

export default function DiagnosticAnalytics() {
  const insights = getDiagnosticKeyInsights();

  return (
    <section id="diagnostic" className="scroll-mt-24 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Diagnostic Analytics
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Customer Demand Patterns & Affinity Diagnostics
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Root cause analysis explaining why certain products sell, when demand surges, and how customers bundle items
        </p>
      </div>

      {/* Row 1: Day-of-Week Demand + Customer Retention Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Day of the Week Demand (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-brand-500" />
                  <span>Sales Volume by Day of the Week</span>
                </h3>
                <p className="text-xs text-slate-400">Order count and revenue concentration across weekdays vs weekends</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                Saturday Peak: 742 Orders
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAY_OF_WEEK_DEMAND} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                    {DAY_OF_WEEK_DEMAND.map((entry, index) => {
                      const isWeekend = entry.day === 'Sat' || entry.day === 'Sun';
                      return (
                        <Cell
                          key={`dow-${index}`}
                          fill={isWeekend ? '#7C3AED' : '#38BDF8'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-600" /> Weekend Surge (Saturday + Sunday = 35.4% Revenue)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-400" /> Weekday Routine
            </span>
          </div>
        </div>

        {/* Right: Repeat vs First-Time Customer Retention (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-emerald-500" />
                  <span>Customer Retention & Loyalty</span>
                </h3>
                <p className="text-xs text-slate-400">Repeat buyers vs. new pet parent acquisitions</p>
              </div>
            </div>

            {/* Retention Bar Breakdown */}
            <div className="space-y-4 my-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-brand-600 dark:text-brand-400">Repeat Customers</span>
                  <span className="text-slate-900 dark:text-white font-black">{RETENTION_METRICS.repeatPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full" style={{ width: `${RETENTION_METRICS.repeatPercentage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-sky-600 dark:text-sky-400">First-Time Pet Shoppers</span>
                  <span className="text-slate-900 dark:text-white font-black">{RETENTION_METRICS.firstTimePercentage}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${RETENTION_METRICS.firstTimePercentage}%` }} />
                </div>
              </div>
            </div>

            {/* Loyalty Metrics Pill Box */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Avg Repurchase Cycle</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {RETENTION_METRICS.avgRepurchaseCycleDays} Days
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Monthly Consumables</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Revenue Contribution</span>
                <p className="text-base font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                  {RETENTION_METRICS.repeatRevenueShare}
                </p>
                <span className="text-[10px] text-slate-500">From Repeat Buyers</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Churn Risk Index: <strong className="text-emerald-600">{RETENTION_METRICS.churnRiskIndex}</strong></span>
            <span>Total Cohort: 3,842</span>
          </div>
        </div>
      </div>

      {/* Row 2: Popular Product Combinations (Market Basket Affinity) */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-500" />
              <span>Market Basket Analysis: Popular Product Combinations</span>
            </h3>
            <p className="text-xs text-slate-400">Co-purchasing frequency, cross-category synergies, and automated bundle potential</p>
          </div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-xl">
            Cross-Sell Affinities
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRODUCT_COMBINATIONS.map((bundle, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>{bundle.categoryPair}</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {bundle.coPurchaseRate}% Co-Buy
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <span>{bundle.primary}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-3">
                    + {bundle.companion}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Bundle Revenue:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{bundle.bundleRevenue}</span>
                </div>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium leading-tight">
                  {bundle.recommendedAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Rule-based Diagnostic Key Insights Panel */}
      <InsightPanel insights={insights} />
    </section>
  );
}
