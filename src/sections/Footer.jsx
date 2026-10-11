import React from 'react';
import { Heart, Sparkles, Layers, ShieldCheck, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="mt-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/60 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Col 1: Brand & Academic Statement (5 cols) */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-mint-400 p-[2px] flex-shrink-0 shadow-sm">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white">
                  <svg className="w-5 h-5 text-brand-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-4.5-2C8.6 11 9.5 10.1 9.5 9S8.6 7 7.5 7 5.5 7.9 5.5 9s.9 2 2 2zm9 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-9-5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                  </svg>
                </div>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                PetPulse Analytics
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              College Capstone Project: Comprehensive 3D Pet Care Products Retail Analytics Platform featuring descriptive, diagnostic, predictive, and prescriptive business intelligence.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Academic Project — Demonstration Data</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Dashboard Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => scrollTo('overview')} className="hover:text-brand-600 transition-colors">
                  Overview Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('descriptive')} className="hover:text-brand-600 transition-colors">
                  Sales Analytics (Descriptive)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('showcase')} className="hover:text-brand-600 transition-colors">
                  Product Performance Showcase
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('diagnostic')} className="hover:text-brand-600 transition-colors">
                  Customer Insights (Diagnostic)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('predictive')} className="hover:text-brand-600 transition-colors">
                  Sales Forecast (Predictive)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('prescriptive')} className="hover:text-brand-600 transition-colors">
                  Stock Recommendations (Prescriptive)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology Stack (4 cols) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Architecture & Technology Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                'React.js 18',
                'Vite 5',
                'Three.js',
                'React Three Fiber',
                '@react-three/drei',
                'Tailwind CSS',
                'Framer Motion',
                'Recharts',
                'Lucide React',
                'Canvas Confetti'
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Designed with genuine 3D WebGL scenes, glassmorphism, responsive data grids, and local state management.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 PetPulse Analytics • Built for Academic College Evaluation.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Created with precision for retail data excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
