import React from 'react';
import { Play, Download, Trash2, Sliders } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { formatFileSize, calculateSpaceSaved } from '../utils/formatHelpers';

interface BatchToolbarProps {
  items: MediaItem[];
  isProcessing: boolean;
  overallProgress: number;
  onCompressAll: () => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  onApplyGlobalImageFormat: (format: 'webp' | 'jpeg' | 'png', quality: number) => void;
  onApplyGlobalVideoFormat: (format: 'mp4' | 'webm', quality: 'balanced' | 'small_size') => void;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  items,
  isProcessing,
  overallProgress,
  onCompressAll,
  onDownloadAllZip,
  onClearAll,
  onApplyGlobalImageFormat,
  onApplyGlobalVideoFormat,
}) => {
  if (items.length === 0) return null;

  const completedItems = items.filter((item) => item.status === 'completed');
  const hasCompleted = completedItems.length > 0;
  const pendingItems = items.filter((item) => item.status === 'idle' || item.status === 'error');
  const hasPending = pendingItems.length > 0;

  const totalOriginalSize = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressedSize = completedItems.reduce((acc, curr) => acc + (curr.compressedSize || curr.originalSize), 0);
  const savings = completedItems.length > 0 ? calculateSpaceSaved(
    completedItems.reduce((acc, curr) => acc + curr.originalSize, 0),
    totalCompressedSize
  ) : null;

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Batch Queue ({items.length} {items.length === 1 ? 'file' : 'files'})
            </h2>
            {completedItems.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {completedItems.length} of {items.length} Ready
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Original Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatFileSize(totalOriginalSize)}</span>
            {savings && savings.bytesSaved > 0 && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">
                • Saved {formatFileSize(savings.bytesSaved)} ({savings.percentage}%)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={onCompressAll}
            disabled={isProcessing || !hasPending}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all duration-200 active:scale-95 ${
              isProcessing || !hasPending
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60 shadow-none'
                : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-500/25'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isProcessing ? 'Processing Batch...' : `Compress All (${pendingItems.length})`}</span>
          </button>

          <button
            onClick={onDownloadAllZip}
            disabled={!hasCompleted}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
              hasCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download All (.ZIP)</span>
          </button>

          <button
            onClick={onClearAll}
            disabled={isProcessing}
            className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
          <Sliders className="w-4 h-4 text-brand-500" />
          <span>Quick Batch Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onApplyGlobalImageFormat('webp', 80)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            ⚡ All Images to WebP (80% Quality)
          </button>
          <button
            onClick={() => onApplyGlobalImageFormat('jpeg', 75)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            📷 All Images to JPG (75% Quality)
          </button>
          <button
            onClick={() => onApplyGlobalVideoFormat('mp4', 'balanced')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 font-medium transition-colors border border-slate-200 dark:border-slate-700"
          >
            🎬 All Videos to MP4 (Balanced)
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-600 dark:text-brand-400">Processing Batch Queue...</span>
            <span className="text-slate-700 dark:text-slate-300">{overallProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
