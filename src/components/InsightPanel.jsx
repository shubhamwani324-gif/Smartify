import React from 'react';
import { Lightbulb, ArrowUpRight, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function InsightPanel({ insights }) {
  const getBadgeStyle = (severity) => {
    switch (severity) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'info':
      default:
        return 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200 dark:border-brand-800';
    }
  };

  const getIcon = (severity) => {
    switch (severity) {
      case 'positive':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-brand-500" />;
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Diagnostic Intelligence Insights
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rule-based explanatory analysis generated from retail transaction streams
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Automated Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70 hover:border-brand-300 dark:hover:border-brand-800 transition-all hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeStyle(item.severity)}`}>
                  {item.badge}
                </span>
                <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-lg">
                  {item.metric}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                {getIcon(item.severity)}
                <span>{item.title}</span>
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                {item.detail}
              </p>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-500" />
              <span><strong>Recommendation:</strong> {item.actionable}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
