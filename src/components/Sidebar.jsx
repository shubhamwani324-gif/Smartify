import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Users2,
  TrendingUp,
  Boxes,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({
  activeSection,
  setActiveSection,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: 'Live' },
    { id: 'descriptive', label: 'Sales Analytics', icon: BarChart3, tag: null },
    { id: 'showcase', label: 'Product Performance', icon: Package, tag: null },
    { id: 'diagnostic', label: 'Customer Insights', icon: Users2, tag: 'Demand' },
    { id: 'predictive', label: 'Sales Forecast', icon: TrendingUp, tag: 'AI' },
    { id: 'prescriptive', label: 'Stock Recommendations', icon: Boxes, tag: 'Action' },
    { id: 'settings', label: 'Settings', icon: Sliders, tag: null },
  ];

  const handleNavClick = (id) => {
    setActiveSection(id);
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 transition-all duration-300 ease-in-out glass-panel border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col no-print
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('overview')}>
            {/* Branded Paw Logo */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-mint-400 p-[2px] flex-shrink-0 shadow-md">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white">
                <svg className="w-6 h-6 text-brand-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-4.5-2C8.6 11 9.5 10.1 9.5 9S8.6 7 7.5 7 5.5 7.9 5.5 9s.9 2 2 2zm9 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-9-5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                </svg>
              </div>
            </div>

            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-1">
                  PetPulse <span className="text-brand-600 dark:text-brand-400 font-semibold text-xs bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded-md">BI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Retail Analytics
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                {(!isCollapsed || mobileOpen) && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}

                {(!isCollapsed || mobileOpen) && item.tag && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider
                      ${isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300'
                      }
                    `}
                  >
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pro / Academic Project Footnote Card in Sidebar */}
        {(!isCollapsed || mobileOpen) && (
          <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-brand-500/10 via-mint-500/10 to-transparent border border-brand-200/50 dark:border-brand-900/40">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Capstone</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Pet Care Products Retail Analytics with simulated real-world demand models.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
