import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

// Mini SVG Sparkline Component
function Sparkline({ data, isPositive }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 110;
  const height = 36;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Shaded Area Under Curve */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${isPositive})`}
      />
      {/* Line Path */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function KpiCard({
  title,
  formattedValue,
  change,
  isPositive,
  previousPeriod,
  sparklineData,
  tooltip,
  icon: Icon,
  gradientColor = 'from-brand-500 to-indigo-600',
  iconColor = 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60'
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle 3D tilt calculation on mouse move
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8; // Max 4deg tilt
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setShowTooltip(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease-out'
      }}
      className="relative rounded-3xl p-6 glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
    >
      {/* Top Accent Gradient Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColor} opacity-75`} />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${iconColor} shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                {title}
              </span>
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative"
                aria-label="Metric details"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-tight font-normal z-30 shadow-xl pointer-events-none">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Change Badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            isPositive
              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{change}</span>
        </div>
      </div>

      {/* Main Metric Value and Sparkline */}
      <div className="flex items-end justify-between gap-2 mt-2">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            {formattedValue}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            vs. {previousPeriod} prev. period
          </p>
        </div>

        <div className="flex-shrink-0">
          <Sparkline data={sparklineData} isPositive={isPositive} />
        </div>
      </div>
    </div>
  );
}
