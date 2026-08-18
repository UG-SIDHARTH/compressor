import React, { useState, useRef } from 'react';
import { X, Download, SlidersHorizontal, Image as ImageIcon, Film, Columns, Play, Pause } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'slider' | 'side_by_side'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const origVideoRef = useRef<HTMLVideoElement>(null);
  const compVideoRef = useRef<HTMLVideoElement>(null);

  if (!item || !item.compressedUrl) return null;

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

  const toggleSyncPlayback = () => {
    const orig = origVideoRef.current;
    const comp = compVideoRef.current;
    if (!orig || !comp) return;

    if (isPlaying) {
      orig.pause();
      comp.pause();
      setIsPlaying(false);
    } else {
      orig.currentTime = comp.currentTime;
      orig.play().catch(() => {});
      comp.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleVideoSync = (isOrig: boolean) => {
    const source = isOrig ? origVideoRef.current : compVideoRef.current;
    const target = isOrig ? compVideoRef.current : origVideoRef.current;
    if (source && target && Math.abs(source.currentTime - target.currentTime) > 0.3) {
      target.currentTime = source.currentTime;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 truncate max-w-md">
                Visual Comparison: {item.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Compare original visual fidelity against output compressed quality
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle for Images */}
            {isImage && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('slider')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'slider'
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  onClick={() => setViewMode('side_by_side')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'side_by_side'
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isImage ? (
            viewMode === 'slider' ? (
              /* Interactive Split-Slider Image View */
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                  <span>← Original ({formatFileSize(item.originalSize)})</span>
                  <span>Compressed ({formatFileSize(item.compressedSize || 0)}) →</span>
                </div>

                <div
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseMove={(e) => isDragging && handleSliderMove(e)}
                  onClick={handleSliderMove}
                  className="relative w-full h-[440px] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center"
                >
                  <img
                    src={item.compressedUrl}
                    alt="Compressed Output"
                    className="absolute inset-0 w-full h-full object-contain"
                  />

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={item.previewUrl}
                      alt="Original Source"
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
              /* Side-by-Side Image View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Original ({item.originalFormat})</span>
                    <span>{formatFileSize(item.originalSize)}</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-[360px] flex items-center justify-center p-2">
                    <img
                      src={item.previewUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Compressed ({item.settings.image.format.toUpperCase()})</span>
                    <span>{formatFileSize(item.compressedSize || 0)}</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-slate-900 border border-emerald-500/40 h-[360px] flex items-center justify-center p-2">
                    <img
                      src={item.compressedUrl}
                      alt="Compressed"
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Synchronized Dual Video Player View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleSyncPlayback}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause Synchronized Playback' : 'Play Both Videos Synchronized'}</span>
                </button>

                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Dual video player synchronized at frame-level
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Original Video ({item.originalFormat})</span>
                    <span>{formatFileSize(item.originalSize)}</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                    <video
                      ref={origVideoRef}
                      src={item.previewUrl}
                      controls
                      onTimeUpdate={() => handleVideoSync(true)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Compressed Result ({item.settings.video.format.toUpperCase()})</span>
                    <span>{formatFileSize(item.compressedSize || 0)}</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black border border-emerald-500/40 aspect-video flex items-center justify-center">
                    <video
                      ref={compVideoRef}
                      src={item.compressedUrl}
                      controls
                      onTimeUpdate={() => handleVideoSync(false)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reduction Statistics Summary */}
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

        {/* Modal Footer Controls */}
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
