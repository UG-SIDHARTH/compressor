import React, { useState } from 'react';
import { 
  FileVideo, ImageIcon, Download, Trash2, Sliders, 
  RotateCcw, Eye, Sparkles, AlertCircle, Clock, Zap, ArrowRight, ShieldCheck
} from 'lucide-react';
import type { MediaItem, MediaSettings, VideoFormat, SocialPreset } from '../types/media';
import { PRESETS } from '../types/media';
import { formatFileSize, formatDuration, calculateSpaceSaved } from '../utils/formatHelpers';

interface MediaCardProps {
  item: MediaItem;
  onUpdateSettings: (id: string, settings: Partial<MediaSettings>) => void;
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isImage = item.type === 'image';
  const isCompleted = item.status === 'completed';
  const isItemProcessing = item.status === 'processing';
  const isError = item.status === 'error';

  const imageSettings = item.settings.image;
  const videoSettings = item.settings.video;

  const targetFormat = isImage ? imageSettings.format : videoSettings.format;

  const spaceSaved = isCompleted && item.compressedSize
    ? calculateSpaceSaved(item.originalSize, item.compressedSize)
    : null;

  // Calculate live ETA
  const calculateETA = () => {
    if (!item.elapsedSeconds || item.progress <= 0 || item.progress >= 100) return null;
    const totalEstSecs = (item.elapsedSeconds / item.progress) * 100;
    const remainingSecs = Math.max(1, Math.round(totalEstSecs - item.elapsedSeconds));
    return remainingSecs;
  };

  const etaSeconds = calculateETA();

  const handleImageSettingChange = (field: string, value: any) => {
    onUpdateSettings(item.id, {
      image: { ...imageSettings, [field]: value },
    });
  };

  const handleVideoSettingChange = (field: string, value: any) => {
    onUpdateSettings(item.id, {
      video: { ...videoSettings, [field]: value },
    });
  };

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-md ${
      isCompleted
        ? 'bg-white dark:bg-[#0F1626] border-emerald-500/40 dark:border-emerald-500/30'
        : isError
        ? 'bg-white dark:bg-[#150F14] border-rose-500/40 dark:border-rose-500/30'
        : 'bg-white dark:bg-[#0D121F] border-slate-200 dark:border-slate-800'
    }`}>
      {/* Main Item Row Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Side: Thumbnail & File Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Interactive Thumbnail Preview Badge */}
          <div 
            onClick={() => isCompleted && onOpenComparison(item)}
            className={`relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center group ${
              isCompleted ? 'cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all' : ''
            }`}
            title={isCompleted ? "Click to open live visual comparison preview" : item.name}
          >
            {item.compressedUrl && isImage ? (
              <img
                src={item.compressedUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : item.previewUrl && isImage ? (
              <img
                src={item.previewUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : item.compressedUrl && !isImage ? (
              <video src={item.compressedUrl} className="w-full h-full object-cover" />
            ) : item.previewUrl && !isImage ? (
              <video src={item.previewUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400">
                {isImage ? <ImageIcon className="w-6 h-6" /> : <FileVideo className="w-6 h-6" />}
              </div>
            )}

            {/* Hover overlay badge when completed */}
            {isCompleted && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Eye className="w-4 h-4 text-brand-400" />
                <span className="text-[8px] font-bold">PREVIEW</span>
              </div>
            )}

            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] font-black uppercase bg-black/70 text-white backdrop-blur-xs">
              {item.originalFormat}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={item.name}>
                {item.name}
              </h4>
              {item.hasTransparency && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Alpha / Transparency
                </span>
              )}
              {isCompleted && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{formatFileSize(item.originalSize)}</span>
              {item.originalWidth && item.originalHeight && (
                <>
                  <span>•</span>
                  <span>{item.originalWidth} × {item.originalHeight} px</span>
                </>
              )}
              {item.duration && item.duration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatDuration(item.duration)}</span>
                </>
              )}

              {/* Processing Time Execution Badge */}
              {isCompleted && item.processingTimeMs && (
                <>
                  <span>•</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {(item.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                </>
              )}
            </div>

            {/* Prominent Target Format, Compression Type & Est. Size Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Format Conversion Pill (e.g. MP4 → WEBM) */}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 flex items-center gap-1.5 shadow-2xs">
                <span>{item.originalFormat}</span>
                <ArrowRight className="w-3 h-3 text-brand-500" />
                <span className="text-slate-900 dark:text-white font-black">{targetFormat}</span>
              </span>

              {/* Compression Type / Preset Badge */}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {isImage
                  ? imageSettings.resizeMode === 'preset'
                    ? `Preset: ${PRESETS[imageSettings.preset]?.label.split(' ')[0]}`
                    : imageSettings.resizeMode === 'percentage'
                    ? `Scale: ${imageSettings.scalePercentage}%`
                    : `${imageSettings.format.toUpperCase()} (${imageSettings.quality}%)`
                  : videoSettings.preset === 'smaller_file'
                  ? 'Smaller File (H.265/VP9, CRF 22)'
                  : 'Compatible (H.264, CRF 20)'}
              </span>

              {/* Estimated Size Preview */}
              {item.estimatedSize && !isCompleted && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Est. Output: ~{formatFileSize(item.estimatedSize)}
                </span>
              )}

              {/* Completed Savings Pill */}
              {isCompleted && spaceSaved && item.compressedSize && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Result: {formatFileSize(item.compressedSize)} (Saved {spaceSaved.percentage}%)
                </span>
              )}
            </div>

            {/* Error Output */}
            {isError && item.errorMessage && (
              <div className="pt-1 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{item.errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {/* Prominent Live Preview & Compare Button */}
          {isCompleted && (
            <button
              onClick={() => onOpenComparison(item)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white border border-brand-500/30 transition-all shadow-xs active:scale-95"
              title="Open interactive side-by-side preview and comparison"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          )}

          {/* Single Download */}
          {isCompleted ? (
            <button
              onClick={() => onDownloadItem(item)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          ) : (
            <button
              onClick={() => onProcessItem(item.id)}
              disabled={isProcessing || isItemProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isError ? 'Retry' : 'Compress'}</span>
            </button>
          )}

          {/* Toggle Expand Settings */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Adjust Quality & Preset Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onRemoveItem(item.id)}
            disabled={isItemProcessing}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Progress Bar with Live Elapsed Time & ETA */}
      {isItemProcessing && (
        <div className="px-5 pb-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Processing local media...</span>
              
              {/* Live Elapsed & ETA Timing Display */}
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Elapsed: {item.elapsedSeconds || 1}s</span>
                {etaSeconds !== null && (
                  <>
                    <span>•</span>
                    <span className="text-brand-500 dark:text-brand-400">ETA: ~{etaSeconds}s</span>
                  </>
                )}
              </div>
            </div>

            <span className="text-brand-500 dark:text-brand-400 font-extrabold">{item.progress}%</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expandable Settings Drawer */}
      {isExpanded && (
        <div className="p-5 bg-slate-50 dark:bg-[#0A0E18] border-t border-slate-200 dark:border-slate-800/80 space-y-5 animate-in slide-in-from-top-2 duration-200">
          
          {isImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Photo Format & Quality */}
              <div className="space-y-4">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Format & Quality Settings
                </h5>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Output Format
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'webp', label: 'WebP (Default)' },
                      { id: 'avif', label: 'AVIF (Max Compress)' },
                      { id: 'jpeg', label: 'JPEG (Max Compat)' },
                      { id: 'png', label: 'PNG (Lossless)' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => handleImageSettingChange('format', fmt.id)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all text-center ${
                          imageSettings.format === fmt.id
                            ? 'bg-brand-500 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                  {imageSettings.format === 'avif' && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Note: AVIF provides max compression but takes longer to encode and has slightly lower compatibility on older devices.
                    </p>
                  )}
                  {imageSettings.format === 'png' && !item.hasTransparency && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Note: PNG uses lossless compression. Switch to WebP or JPEG to adjust visual compression sliders.
                    </p>
                  )}
                </div>

                {/* Quality Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Quality Compression</span>
                    <span className="text-brand-500 dark:text-brand-400 font-extrabold">{imageSettings.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={imageSettings.quality}
                    onChange={(e) => handleImageSettingChange('quality', parseInt(e.target.value))}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Smallest File (10%)</span>
                    <span>High Quality (100%)</span>
                  </div>
                </div>
              </div>

              {/* Photo Resizing Options */}
              <div className="space-y-4">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resizing Options
                </h5>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleImageSettingChange('resizeMode', 'custom')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      imageSettings.resizeMode === 'custom'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Custom Dimensions
                  </button>
                  <button
                    onClick={() => handleImageSettingChange('resizeMode', 'percentage')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      imageSettings.resizeMode === 'percentage'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Scale %
                  </button>
                  <button
                    onClick={() => handleImageSettingChange('resizeMode', 'preset')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      imageSettings.resizeMode === 'preset'
                        ? 'bg-brand-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Social Presets
                  </button>
                </div>

                {/* Custom W/H */}
                {imageSettings.resizeMode === 'custom' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Width (px)</label>
                        <input
                          type="number"
                          value={imageSettings.targetWidth || ''}
                          onChange={(e) => handleImageSettingChange('targetWidth', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Height (px)</label>
                        <input
                          type="number"
                          value={imageSettings.targetHeight || ''}
                          onChange={(e) => handleImageSettingChange('targetHeight', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageSettings.maintainAspectRatio}
                        onChange={(e) => handleImageSettingChange('maintainAspectRatio', e.target.checked)}
                        className="rounded accent-brand-500"
                      />
                      <span>Maintain Aspect Ratio</span>
                    </label>
                  </div>
                )}

                {/* Scale % */}
                {imageSettings.resizeMode === 'percentage' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">Scale Percentage</span>
                      <span className="text-brand-500 font-extrabold">{imageSettings.scalePercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={imageSettings.scalePercentage}
                      onChange={(e) => handleImageSettingChange('scalePercentage', parseInt(e.target.value))}
                      className="w-full accent-brand-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Social Preset Dropdown */}
                {imageSettings.resizeMode === 'preset' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Dimension Preset</label>
                    <select
                      value={imageSettings.preset}
                      onChange={(e) => handleImageSettingChange('preset', e.target.value as SocialPreset)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      {Object.entries(PRESETS).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* Video Settings */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Video Quality Preset Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quality Encoding Preset (CRF)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVideoSettingChange('preset', 'compatible')}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      videoSettings.preset === 'compatible'
                        ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs font-extrabold">Compatible (H.264, CRF 20)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Works on all browsers & devices. Best quality retention.
                    </div>
                  </button>

                  <button
                    onClick={() => handleVideoSettingChange('preset', 'smaller_file')}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      videoSettings.preset === 'smaller_file'
                        ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-extrabold shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs font-extrabold">Smaller File (H.265/VP9, CRF 22)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Same visual quality, ~40% smaller size. For modern devices.
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Video Container Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Container Format
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['mp4', 'webm', 'mov', 'avi', 'mkv'] as VideoFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleVideoSettingChange('format', fmt)}
                      className={`py-2 rounded-xl text-xs font-extrabold uppercase transition-all ${
                        videoSettings.format === fmt
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {/* Optional Manual Downscaling Control */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Resolution Downscaling (Optional)
                  </label>
                  <select
                    value={videoSettings.resolution}
                    onChange={(e) => handleVideoSettingChange('resolution', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="original">Keep Original Resolution (Default)</option>
                    <option value="1080p">Downscale to 1080p Full HD</option>
                    <option value="720p">Downscale to 720p HD</option>
                    <option value="480p">Downscale to 480p SD</option>
                  </select>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
