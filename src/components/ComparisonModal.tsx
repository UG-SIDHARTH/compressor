import React, { useState, useRef } from 'react';
import { X, Download, SlidersHorizontal, Image as ImageIcon, Film } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { formatFileSize, calculateSpaceSaved } from '../utils/formatHelpers';

interface ComparisonModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onDownload: (item: MediaItem) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  item,
  onClose,
  onDownload,
}) => {
  if (!item || !item.compressedUrl) return null;

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const origVideoRef = useRef<HTMLVideoElement>(null);
  const compVideoRef = useRef<HTMLVideoElement>(null);

  const isImage = item.type === 'image';
  const savings = item.compressedSize
    ? calculateSpaceSaved(item.originalSize, item.compressedSize)
    : null;

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleVideoPlay = (isOrig: boolean) => {
    const source = isOrig ? origVideoRef.current : compVideoRef.current;
    const target = isOrig ? compVideoRef.current : origVideoRef.current;
    if (source && target) {
      target.currentTime = source.currentTime;
      if (source.paused) target.pause();
      else target.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate max-w-md">
                Comparison: {item.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual result and file size reduction analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isImage ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                <span>Original ({formatFileSize(item.originalSize)})</span>
                <span>Compressed ({formatFileSize(item.compressedSize || 0)})</span>
              </div>

              <div
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseMove={(e) => isDragging && handleSliderMove(e)}
                onClick={handleSliderMove}
                className="relative w-full h-[400px] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner"
              >
                <img
                  src={item.compressedUrl}
                  alt="Compressed"
                  className="absolute inset-0 w-full h-full object-contain"
                />

                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={item.previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain max-w-none"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-10 flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border border-slate-300 flex items-center justify-center text-xs font-bold">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Original Video</span>
                  <span>{formatFileSize(item.originalSize)}</span>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                  <video
                    ref={origVideoRef}
                    src={item.previewUrl}
                    controls
                    onPlay={() => handleVideoPlay(true)}
                    onPause={() => handleVideoPlay(true)}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Compressed Result</span>
                  <span>{formatFileSize(item.compressedSize || 0)}</span>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black border border-emerald-500/40 aspect-video flex items-center justify-center">
                  <video
                    ref={compVideoRef}
                    src={item.compressedUrl}
                    controls
                    onPlay={() => handleVideoPlay(false)}
                    onPause={() => handleVideoPlay(false)}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {savings && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Original Size</p>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{formatFileSize(item.originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compressed Size</p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatFileSize(item.compressedSize || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Space Saved</p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {savings.bytesSaved > 0 ? `${formatFileSize(savings.bytesSaved)}` : '0 B'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reduction Rate</p>
                <p className="text-base font-black text-brand-600 dark:text-brand-400">
                  {savings.percentage > 0 ? `-${savings.percentage}%` : '0%'}
                </p>
              </div>
            </div>
          )}

        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onDownload(item)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Result File</span>
          </button>
        </div>

      </div>

    </div>
  );
};
