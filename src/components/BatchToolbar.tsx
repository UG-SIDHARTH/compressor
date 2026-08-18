import React from 'react';
import { Download, Sparkles, Trash2, Zap, Film, ImageIcon } from 'lucide-react';
import type { MediaItem, ImageFormat, VideoPreset } from '../types/media';
import { formatFileSize, calculateSpaceSaved } from '../utils/formatHelpers';

interface BatchToolbarProps {
  items: MediaItem[];
  isProcessing: boolean;
  overallProgress: number;
  onCompressAll: () => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  onApplyGlobalImageFormat: (format: ImageFormat, quality: number) => void;
  onApplyGlobalVideoFormat: (format: 'mp4' | 'webm', preset: VideoPreset) => void;
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

  const completedItems = items.filter((i) => i.status === 'completed' && i.compressedSize);
  const pendingItems = items.filter((i) => i.status === 'idle' || i.status === 'error');

  const totalOriginalSize = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressedSize = completedItems.reduce((acc, curr) => acc + (curr.compressedSize || 0), 0);

  const totalSavings = completedItems.length > 0 && totalCompressedSize > 0
    ? calculateSpaceSaved(
        completedItems.reduce((acc, curr) => acc + curr.originalSize, 0),
        totalCompressedSize
      )
    : null;

  return (
    <div className="bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
      
      {/* Upper Stats Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Queue Stats */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Batch Queue ({items.length} {items.length === 1 ? 'file' : 'files'})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {completedItems.length} of {items.length} Ready
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Original Size: <span className="font-bold text-slate-700 dark:text-slate-200">{formatFileSize(totalOriginalSize)}</span>
            {totalSavings && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">
                • Saved {formatFileSize(totalSavings.bytesSaved)} ({totalSavings.percentage}%)
              </span>
            )}
          </p>
        </div>

        {/* Global Batch Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          <button
            onClick={onCompressAll}
            disabled={isProcessing || pendingItems.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand-500 to-rose-500 hover:from-brand-600 hover:to-rose-600 text-white disabled:opacity-40 shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Compress All ({pendingItems.length})</span>
          </button>

          {completedItems.length > 0 && (
            <button
              onClick={onDownloadAllZip}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download All (.ZIP)</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            disabled={isProcessing}
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Clear entire queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Progress Bar Gauge */}
      {isProcessing && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Processing batch queue...</span>
            <span className="text-brand-500">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Batch Preset Buttons */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" /> Quick Batch Presets:
        </span>

        <button
          onClick={() => onApplyGlobalImageFormat('webp', 80)}
          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
        >
          <ImageIcon className="w-3 h-3 text-purple-400" /> All Images to WebP (Default 80%)
        </button>

        <button
          onClick={() => onApplyGlobalImageFormat('avif', 75)}
          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
        >
          <ImageIcon className="w-3 h-3 text-amber-400" /> All Images to AVIF (Max Compress)
        </button>

        <button
          onClick={() => onApplyGlobalVideoFormat('mp4', 'compatible')}
          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
        >
          <Film className="w-3 h-3 text-blue-400" /> All Videos to MP4 (Compatible H.264)
        </button>

        <button
          onClick={() => onApplyGlobalVideoFormat('mp4', 'smaller_file')}
          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
        >
          <Film className="w-3 h-3 text-emerald-400" /> All Videos to Smaller File (H.265/VP9)
        </button>
      </div>

    </div>
  );
};
