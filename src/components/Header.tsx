import React from 'react';
import { Sun, Moon, Sparkles, ChevronDown, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLoadSamples: () => void;
  onGoToHub: () => void;
  activeView: 'hub' | 'workspace';
  selectedToolName?: string;
  ffmpegStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onLoadSamples,
  onGoToHub,
  activeView,
  selectedToolName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0B0F19]/90 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-sm dark:shadow-2xl backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Nav items */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          
          {/* CrispCompress Logo Badge */}
          <div 
            onClick={onGoToHub} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/logo.jpg"
              alt="CrispCompress PRO Logo"
              className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                CrispCompress
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 dark:border-cyan-500/40">
                PRO
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300">
            <button
              onClick={onGoToHub}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${activeView === 'hub' ? 'text-slate-900 dark:text-white underline underline-offset-8 decoration-cyan-500 decoration-2 font-black' : ''}`}
            >
              ALL MEDIA TOOLS
            </button>
            {activeView === 'workspace' && selectedToolName && (
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-500/30">
                <span>Active Tool:</span>
                <span className="text-slate-900 dark:text-white">{selectedToolName}</span>
              </div>
            )}
          </nav>

        </div>

        {/* Action Controls & Hub Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Back to All Tools / All Tools Hub Button */}
          {activeView === 'workspace' ? (
            <button
              onClick={onGoToHub}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-[#141A29] text-cyan-600 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Tools</span>
            </button>
          ) : (
            <button
              onClick={onGoToHub}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/50 shadow-sm"
            >
              <span>ALL MEDIA TOOLS</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Load Sample Files Button */}
          <button
            onClick={onLoadSamples}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            title="Load high-res sample media to test instantly"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Try Samples</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#141A29] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-800 shadow-sm"
            aria-label="Toggle theme"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
