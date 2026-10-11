import React, { useState } from 'react';
import HeroSceneCanvas from '../components/3d/HeroSceneCanvas';
import { ArrowDown, BarChart2, ShieldCheck, Sparkles, Layers, Cpu, Eye } from 'lucide-react';

export default function Hero3D() {
  const [lowSpec, setLowSpec] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative w-full pt-4 pb-12 lg:py-12 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-400/15 dark:bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-mint-400/15 dark:bg-mint-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text & CTA Column (5 cols) */}
          <div className="lg:col-span-5 z-10 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200/80 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-sm mb-5">
              <Sparkles className="w-4 h-4 text-brand-500 animate-spin-slow" />
              <span>Next-Gen Pet Retail Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span className="text-slate-500 dark:text-slate-400 font-normal">College Project</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans leading-[1.15]">
              Pet Care Products{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-mint-500">
                Retail Analytics
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              Turn retail data into smarter decisions for every pet. Discover real-time sales performance, customer demand affinities, future forecasting, and automated stock replenishment.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => scrollToSection('overview')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <span>Explore Analytics</span>
                <ArrowDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('descriptive')}
                className="px-6 py-3.5 rounded-2xl glass-panel hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <BarChart2 className="w-4 h-4 text-brand-500" />
                <span>View Sales Report</span>
              </button>
            </div>

            {/* Micro Feature Bullets */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-4 w-full">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">4 Analytics Tiers</h4>
                  <p className="text-[11px] text-slate-400">Descriptive to Prescriptive</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-mint-50 dark:bg-mint-950/50 text-mint-600 dark:text-mint-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">3D Interactive</h4>
                  <p className="text-[11px] text-slate-400">R3F Procedural Models</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Visual Canvas (7 cols) */}
          <div className="lg:col-span-7 relative flex items-center justify-center">
            {/* 3D Canvas Box */}
            <div className="w-full h-[460px] lg:h-[540px] rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-2xl relative overflow-hidden">
              <HeroSceneCanvas lowSpec={lowSpec} />

              {/* Toggle Performance Mode button in corner */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setLowSpec(!lowSpec)}
                  className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors shadow-sm flex items-center gap-1.5"
                  title="Toggle between 3D Canvas and 2D Optimized Mode"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lowSpec ? 'Enable 3D Scene' : '2D Canvas Mode'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
