import React, { useState } from 'react';
import { 
  Film, Image as ImageIcon, Play, Download, Trash2, Sliders, Eye, 
  CheckCircle, AlertCircle, RefreshCw, Lock, Unlock
} from 'lucide-react';
import type { 
  MediaItem, ImageFormat, VideoFormat, VideoQuality, ResizeMode, PresetDimension 
} from '../types/media';
import { PRESETS } from '../types/media';
import { formatFileSize, formatDuration, calculateSpaceSaved } from '../utils/formatHelpers';

interface MediaCardProps {
  item: MediaItem;
  onUpdateSettings: (id: string, updatedSettings: Partial<MediaItem['settings']>) => void;
  onProcessItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onOpenComparison: (item: MediaItem) => void;
  onDownloadItem: (item: MediaItem) => void;
  isProcessing: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onUpdateSettings,
  onProcessItem,
  onRemoveItem,
  onOpenComparison,
  onDownloadItem,
  isProcessing,
}) => {
  const [showSettings, setShowSettings] = useState(true);

  const isImage = item.type === 'image';
  const imgSettings = item.settings.image;
  const vidSettings = item.settings.video;

  const savings = item.status === 'completed' && item.compressedSize
    ? calculateSpaceSaved(item.originalSize, item.compressedSize)
    : null;

  return (
    <div className={`glass-card rounded-3xl overflow-hidden border transition-all duration-300 ${
      item.status === 'completed'
        ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
        : item.status === 'error'
        ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      
      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
        
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {isImage ? (
              <img
                src={item.previewUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={item.previewUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
            <div className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs">
              {isImage ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3 text-brand-400" />}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate" title={item.name}>
              {item.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {item.originalFormat}
              </span>
              <span>{formatFileSize(item.originalSize)}</span>
              {item.originalWidth && item.originalHeight && (
                <span>• {item.originalWidth}×{item.originalHeight}px</span>
              )}
              {item.duration !== undefined && item.duration > 0 && (
                <span>• {formatDuration(item.duration)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {item.status === 'completed' && (
            <>
              <button
                onClick={() => onOpenComparison(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 transition-colors"
                title="Compare Original vs Compressed result"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => onDownloadItem(item)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </>
          )}

          {item.status === 'idle' && (
            <button
              onClick={() => onProcessItem(item.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Process</span>
            </button>
          )}

          {item.status === 'error' && (
            <button
              onClick={() => onProcessItem(item.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              showSettings 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title="Toggle Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => onRemoveItem(item.id)}
            disabled={item.status === 'processing'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors disabled:opacity-40"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {showSettings && (
        <div className="p-5 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          
          {isImage ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <select
                  value={imgSettings.format}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      image: { ...imgSettings, format: e.target.value as ImageFormat },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="webp">WebP (Recommended - Smallest)</option>
                  <option value="jpeg">JPEG / JPG (Standard)</option>
                  <option value="png">PNG (Lossless / Transparent)</option>
                  <option value="gif">GIF</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Quality</label>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{imgSettings.quality}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={imgSettings.quality}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      image: { ...imgSettings, quality: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resize Mode
                </label>
                <select
                  value={imgSettings.resizeMode}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      image: { ...imgSettings, resizeMode: e.target.value as ResizeMode },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="custom">Original / Custom Pixels</option>
                  <option value="percentage">Percentage Scale (%)</option>
                  <option value="preset">Social & HD Presets</option>
                </select>
              </div>

              {imgSettings.resizeMode === 'percentage' && (
                <div className="col-span-full flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Scale:</span>
                  <div className="flex items-center gap-2 flex-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          onUpdateSettings(item.id, {
                            image: { ...imgSettings, scalePercentage: pct },
                          })
                        }
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          imgSettings.scalePercentage === pct
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={imgSettings.scalePercentage}
                      onChange={(e) =>
                        onUpdateSettings(item.id, {
                          image: { ...imgSettings, scalePercentage: parseInt(e.target.value) || 100 },
                        })
                      }
                      className="w-16 px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-600 bg-transparent text-center font-bold"
                    />
                    <span className="text-xs font-semibold">%</span>
                  </div>
                </div>
              )}

              {imgSettings.resizeMode === 'preset' && (
                <div className="col-span-full bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Preset Dimensions
                  </label>
                  <select
                    value={imgSettings.preset}
                    onChange={(e) =>
                      onUpdateSettings(item.id, {
                        image: { ...imgSettings, preset: e.target.value as PresetDimension },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    {Object.values(PRESETS).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.description})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {imgSettings.resizeMode === 'custom' && (
                <div className="col-span-full flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">W:</span>
                    <input
                      type="number"
                      placeholder="Auto"
                      value={imgSettings.targetWidth || ''}
                      onChange={(e) =>
                        onUpdateSettings(item.id, {
                          image: { ...imgSettings, targetWidth: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-24 px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-600 bg-transparent text-slate-800 dark:text-slate-100 font-semibold"
                    />
                    <span className="text-xs text-slate-400">px</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">H:</span>
                    <input
                      type="number"
                      placeholder="Auto"
                      value={imgSettings.targetHeight || ''}
                      onChange={(e) =>
                        onUpdateSettings(item.id, {
                          image: { ...imgSettings, targetHeight: parseInt(e.target.value) || 0 },
                        })
                      }
                      className="w-24 px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-600 bg-transparent text-slate-800 dark:text-slate-100 font-semibold"
                    />
                    <span className="text-xs text-slate-400">px</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings(item.id, {
                        image: { ...imgSettings, maintainAspectRatio: !imgSettings.maintainAspectRatio },
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      imgSettings.maintainAspectRatio
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {imgSettings.maintainAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>Maintain Aspect Ratio</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <select
                  value={vidSettings.format}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      video: { ...vidSettings, format: e.target.value as VideoFormat },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="mp4">MP4 (H.264 - Universal Compatibility)</option>
                  <option value="webm">WebM (VP9 - High Web Efficiency)</option>
                  <option value="mov">MOV (QuickTime)</option>
                  <option value="mkv">MKV (Matroska)</option>
                  <option value="avi">AVI</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Compression Quality
                </label>
                <select
                  value={vidSettings.quality}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      video: { ...vidSettings, quality: e.target.value as VideoQuality },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="high_quality">High Quality (Low Compression)</option>
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="small_size">Small File Size (High Compression)</option>
                  <option value="maximum_compression">Maximum Compression (Smallest Size)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resolution Output
                </label>
                <select
                  value={vidSettings.resolution}
                  onChange={(e) =>
                    onUpdateSettings(item.id, {
                      video: { ...vidSettings, resolution: e.target.value as any },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="original">Original Resolution</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                </select>
              </div>

            </div>
          )}

          {item.estimatedSize && item.status !== 'completed' && (
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between pt-1">
              <span>Estimated output size: <strong className="text-brand-600 dark:text-brand-400 font-bold">{formatFileSize(item.estimatedSize)}</strong></span>
              <span className="text-slate-400 text-[11px]">Est. change: ~{Math.round(((item.originalSize - item.estimatedSize) / item.originalSize) * 100)}%</span>
            </div>
          )}

        </div>
      )}

      {item.status === 'processing' && (
        <div className="p-4 bg-brand-50/80 dark:bg-brand-950/40 border-t border-brand-200/50 dark:border-brand-800/50 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-brand-700 dark:text-brand-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing local media...</span>
            </span>
            <span>{item.progress}%</span>
          </div>
          <div className="w-full h-2 bg-brand-200 dark:bg-brand-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.status === 'completed' && item.compressedSize && savings && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Compressed Result: {formatFileSize(item.compressedSize)}</span>
          </div>

          <div className={`px-3 py-1 rounded-full font-black text-xs ${
            savings.isSmaller 
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-amber-500 text-white'
          }`}>
            {savings.isSmaller
              ? `🟢 Saved ${formatFileSize(savings.bytesSaved)} (${savings.percentage}%)`
              : `⚡ Output: ${formatFileSize(item.compressedSize)}`}
          </div>
        </div>
      )}

      {item.status === 'error' && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-t border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{item.errorMessage || 'Failed to process file. Please try again.'}</span>
        </div>
      )}

    </div>
  );
};
