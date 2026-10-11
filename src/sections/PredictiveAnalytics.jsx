import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { FORECAST_HORIZONS, getForecastTimeline } from '../data/forecastData';
import {
  TrendingUp,
  BrainCircuit,
  Sliders,
  Calendar,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  Info
} from 'lucide-react';

function ForecastTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs backdrop-blur-md min-w-[180px]">
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
          <span className="font-bold text-slate-200">{label}</span>
          {data.isForecast ? (
            <span className="text-[10px] font-bold text-brand-400 bg-brand-950/80 px-1.5 py-0.5 rounded">
              Projected
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
              Actual
            </span>
          )}
        </div>

        {data.actual !== null && (
          <p className="text-slate-300 flex justify-between mt-1">
            <span>Actual Revenue:</span>
            <strong className="text-white">₹{data.actual.toLocaleString('en-IN')}</strong>
          </p>
        )}

        {data.forecast !== null && (
          <div className="mt-1 space-y-0.5">
            <p className="text-brand-300 flex justify-between">
              <span>Forecast Value:</span>
              <strong className="text-brand-400 font-black">₹{data.forecast.toLocaleString('en-IN')}</strong>
            </p>
            {data.upper && (
              <p className="text-[11px] text-slate-400 flex justify-between">
                <span>95% Confidence:</span>
                <span>₹{(data.lower/1000).toFixed(0)}k – ₹{(data.upper/1000).toFixed(0)}k</span>
              </p>
            )}
          </div>
        )}

        {data.note && (
          <p className="text-[10px] text-slate-400 mt-2 italic pt-1 border-t border-slate-800/80">
            {data.note}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function PredictiveAnalytics() {
  const [horizon, setHorizon] = useState('30');
  const horizonConfig = FORECAST_HORIZONS[horizon];
  const chartData = getForecastTimeline(horizon);

  return (
    <section id="predictive" className="scroll-mt-24 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider">
              Predictive Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Sales & Demand Forecast Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Projected turnover with statistical upper/lower bounds across customizable forecasting horizons
          </p>
        </div>

        {/* Horizon Toggle Tabs (7, 30, 90 Days) */}
        <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm self-start sm:self-auto">
          <span className="px-2.5 text-slate-400 text-xs font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-500" />
            <span>Horizon:</span>
          </span>
          {[
            { id: '7', label: '7 Days' },
            { id: '30', label: '30 Days' },
            { id: '90', label: '90 Days' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setHorizon(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                horizon === item.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-brand-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Estimated Future Revenue
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {horizonConfig.formattedRevenue}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{horizonConfig.growthRate} Projected Growth</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Projected Orders
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {horizonConfig.predictedOrders.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {horizonConfig.days} calendar days
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Confidence Interval
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {horizonConfig.confidenceInterval}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Margin: {horizonConfig.marginOfError}
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            High Demand Catalysts
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {horizonConfig.highDemandCategories.map((cat, idx) => (
              <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300">
                {cat}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Seasonal correlation</span>
        </div>
      </div>

      {/* Main Forecast Composed Chart */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-brand-500" />
              <span>Historical Actuals vs. Projected Trajectory ({horizonConfig.label})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Solid curve represents recorded revenue; dashed curve with shaded confidence envelope shows future projection.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-3.5 h-1 bg-slate-500 rounded" /> Historical Actuals
            </span>
            <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <span className="w-3.5 h-1 border-b-2 border-dashed border-brand-500" /> Projected Horizon
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded" /> Confidence Band
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${val / 1000}k`}`}
              />
              <Tooltip content={<ForecastTooltip />} />

              {/* Shaded Confidence Envelope (Upper Bound) */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="transparent"
                fill="#10B981"
                fillOpacity={0.12}
                isAnimationActive={true}
              />

              {/* Actuals Solid Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#64748B"
                strokeWidth={3}
                dot={{ r: 4, fill: '#64748B' }}
                connectNulls={false}
              />

              {/* Projected Dashed Line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#8B5CF6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#8B5CF6' }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-900 dark:text-brand-200 leading-relaxed">
            <strong>Horizon Analysis:</strong> {horizonConfig.summaryText}
          </p>
        </div>
      </div>

      {/* Mandatory College Project Disclaimer Banner */}
      <div className="rounded-2xl p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            Academic Project Disclosure: Simulated Demo Estimates
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
            All predictive values, confidence ranges, and horizon projections are simulated frontend estimates computed via polynomial smoothing and retail seasonality coefficients for this academic demonstration. They do not represent financial forecasts from an external machine learning server.
          </p>
        </div>
      </div>
    </section>
  );
}
