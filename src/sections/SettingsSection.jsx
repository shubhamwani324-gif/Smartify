import React, { useState } from 'react';
import { Sliders, Sun, Moon, Sparkles, RefreshCw, ShieldCheck, CheckCircle2, Bell, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SettingsSection({ theme, toggleTheme }) {
  const [safetyBuffer, setSafetyBuffer] = useState(20);
  const [criticalDaysThreshold, setCriticalDaysThreshold] = useState(5);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch (e) {
      // ignore if confetti fails
    }
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <section id="settings" className="scroll-mt-24 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">
            Configuration
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Dashboard & Retail Analytics Parameters
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize calculation thresholds, display aesthetics, and alert rules for the demonstration environment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: UI & Visuals */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Display & Visual Experience</span>
          </h3>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Interface Color Theme</span>
              <span className="text-[11px] text-slate-400">Current active mode: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>Toggle to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Base Currency Formatting</span>
              <span className="text-[11px] text-slate-400">Indian Rupee (INR ₹) Lakh / Crore scale</span>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              ₹ INR (Fixed)
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Simulated Stream Auto-Refresh</span>
              <span className="text-[11px] text-slate-400">Periodic mock telemetry heartbeat</span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                autoRefresh ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  autoRefresh ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Card 2: Inventory & Prescriptive Engine */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-500" />
            <span>Prescriptive Inventory Parameters</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">Default Reorder Safety Buffer:</span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400">{safetyBuffer}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="5"
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Applied automatically to all automated purchase order calculations
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">Critical Stock Warning Threshold:</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">&lt; {criticalDaysThreshold} Days</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              value={criticalDaysThreshold}
              onChange={(e) => setCriticalDaysThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Triggers visual alert badge when days until stock depletion falls below this value
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Settings Saved Successfully!</span>
                </>
              ) : (
                <span>Save Demo Configuration</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
