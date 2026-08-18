import React from 'react';
import { Sun, Moon, ShieldCheck, Zap, Sparkles, Cpu } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLoadSamples: () => void;
  ffmpegStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onLoadSamples,
  ffmpegStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
            <Zap className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
              Compressify Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Client-Side Video & Image Compression & Conversion
            </p>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Privacy Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Private & In-Browser</span>
          </div>

          {/* Engine Status */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-brand-500" />
            <span>{ffmpegStatus || 'WASM Engine Ready'}</span>
          </div>

          {/* Load Sample Files Button */}
          <button
            onClick={onLoadSamples}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-indigo-500/25 transition-all duration-200 active:scale-95"
            title="Load sample media files to test instantly without uploading"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try Sample Files</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle theme"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
