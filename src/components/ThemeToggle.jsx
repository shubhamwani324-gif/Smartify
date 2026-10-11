import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, toggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className="p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-brand-400 dark:hover:border-brand-500 shadow-sm hover:shadow text-slate-700 dark:text-slate-200 group"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-brand-600 transition-transform duration-300 -rotate-12 group-hover:rotate-0" />
        )}
      </div>
    </button>
  );
}
