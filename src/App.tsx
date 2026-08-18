import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  MediaItem, MediaSettings, ImageFormat, VideoFormat, ImageSettings, VideoSettings, VideoPreset 
} from './types/media';
import { getMediaTypeFromExtension, getFileExtension, formatFileSize } from './utils/formatHelpers';
import { getImageDimensions, processImage, estimateImageSize, checkImageTransparency } from './utils/imageProcessor';
import { getVideoMetadata, processVideo, estimateVideoSize, getFFmpeg } from './utils/videoProcessor';
import { downloadAllAsZip, downloadSingleFile } from './utils/zipPackager';
import { createSampleImageFiles } from './utils/sampleMedia';

import { Header } from './components/Header';
import { ToolsHub } from './components/ToolsHub';
import { ToolWorkspaceHeader } from './components/ToolWorkspaceHeader';
import { UploadZone } from './components/UploadZone';
import { BatchToolbar } from './components/BatchToolbar';
import { MediaCard } from './components/MediaCard';
import { ComparisonModal } from './components/ComparisonModal';
import { ToastNotification } from './components/ToastNotification';
import type { ToastMessage } from './components/ToastNotification';

const MAX_VIDEO_SIZE_BYTES = 1.5 * 1024 * 1024 * 1024; // 1.5 GB limit for videos

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [activeView, setActiveView] = useState<'hub' | 'workspace'>('hub');
  const [selectedTool, setSelectedTool] = useState<any>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [comparisonItem, setComparisonItem] = useState<MediaItem | null>(null);
  const [ffmpegStatus, setFfmpegStatus] = useState<string>('WASM Engine Idle');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [items]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    getFFmpeg((status) => setFfmpegStatus(status)).catch(() => {
      setFfmpegStatus('WASM available on demand');
    });
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    const newItems: MediaItem[] = [];

    for (const file of files) {
      if (file.size === 0) {
        addToast('error', 'Empty File Ignored', `${file.name} is 0 bytes and cannot be processed.`);
        continue;
      }

      const type = getMediaTypeFromExtension(file.name);
      if (type === 'unsupported') {
        addToast('error', 'Unsupported Format', `${file.name} is not a supported video or photo format.`);
        continue;
      }

      // 1. Strict 1.5 GB Restriction specifically for Videos
      if (type === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
        addToast(
          'error',
          'Video Exceeds 1.5 GB Limit',
          `${file.name} is ${formatFileSize(file.size)}. Maximum allowed video size is 1.5 GB.`
        );
        continue;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      const ext = getFileExtension(file.name);

      let originalWidth: number | undefined;
      let originalHeight: number | undefined;
      let duration: number | undefined;
      let hasTransparency = false;

      if (type === 'image') {
        hasTransparency = await checkImageTransparency(file);
      }

      const defaultImgFormat: ImageFormat = hasTransparency ? 'png' : 'webp';

      const defaultImageSettings: ImageSettings = {
        format: defaultImgFormat,
        quality: 80,
        resizeMode: 'custom',
        targetWidth: 0,
        targetHeight: 0,
        scalePercentage: 100,
        preset: 'instagram_post',
        maintainAspectRatio: true,
      };

      const defaultVideoSettings: VideoSettings = {
        format: (['webm', 'mov', 'avi', 'mkv'].includes(ext) ? ext : 'mp4') as VideoFormat,
        preset: 'compatible',
        resolution: 'original',
      };

      if (selectedTool?.payload) {
        if (type === 'image' && selectedTool.actionType === 'preset_image') {
          Object.assign(defaultImageSettings, selectedTool.payload);
        }
        if (type === 'video' && selectedTool.actionType === 'preset_video') {
          Object.assign(defaultVideoSettings, selectedTool.payload);
        }
        if (type === 'image' && selectedTool.actionType === 'resize') {
          Object.assign(defaultImageSettings, selectedTool.payload);
        }
      }

      if (type === 'image') {
        try {
          const dims = await getImageDimensions(file);
          originalWidth = dims.width;
          originalHeight = dims.height;
          if (defaultImageSettings.targetWidth === 0) {
            defaultImageSettings.targetWidth = dims.width;
          }
          if (defaultImageSettings.targetHeight === 0) {
            defaultImageSettings.targetHeight = dims.height;
          }
        } catch (err: any) {
          addToast('error', 'Invalid Image File', `${file.name}: ${err.message || 'Corrupted file'}`);
          continue;
        }
      } else if (type === 'video') {
        try {
          const meta = await getVideoMetadata(file);
          duration = meta.duration;
          originalWidth = meta.width;
          originalHeight = meta.height;
        } catch {
          // Fallback metadata
        }
      }

      const defaultSettings: MediaSettings = {
        image: defaultImageSettings,
        video: defaultVideoSettings,
      };

      const estSize = type === 'image' && originalWidth && originalHeight
        ? estimateImageSize(file.size, originalWidth, originalHeight, defaultImageSettings)
        : type === 'video' && duration
        ? estimateVideoSize(file.size, duration, defaultVideoSettings)
        : Math.round(file.size * 0.75);

      newItems.push({
        id,
        file,
        name: file.name,
        type,
        originalSize: file.size,
        originalFormat: ext.toUpperCase(),
        originalWidth,
        originalHeight,
        duration,
        hasTransparency,
        previewUrl,
        status: 'idle',
        progress: 0,
        estimatedSize: estSize,
        settings: defaultSettings,
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      addToast('success', 'Files Added', `Added ${newItems.length} file(s) to processing queue.`);
    }
  };

  const handleLoadSamples = async () => {
    try {
      addToast('info', 'Loading Sample Media...', 'Generating test images in memory');
      const sampleFiles = await createSampleImageFiles();
      await handleFilesSelected(sampleFiles);
      if (activeView === 'hub') {
        setActiveView('workspace');
      }
    } catch (err: any) {
      addToast('error', 'Sample Loading Failed', err.message);
    }
  };

  const handleSelectTool = (tool: any) => {
    if (tool.id === 'load_samples') {
      handleLoadSamples();
      return;
    }

    if (tool.id === 'zip_download') {
      handleDownloadAllZip();
      return;
    }

    setSelectedTool(tool);
    setActiveView('workspace');

    if (tool.actionType === 'preset_image' && tool.payload) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'image') return item;
          const newImg = { ...item.settings.image, ...tool.payload };
          const est = item.originalWidth && item.originalHeight
            ? estimateImageSize(item.originalSize, item.originalWidth, item.originalHeight, newImg)
            : item.estimatedSize;
          return { ...item, settings: { ...item.settings, image: newImg }, estimatedSize: est };
        })
      );
    }

    if (tool.actionType === 'preset_video' && tool.payload) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'video') return item;
          const newVid = { ...item.settings.video, ...tool.payload };
          const est = item.duration
            ? estimateVideoSize(item.originalSize, item.duration, newVid)
            : item.estimatedSize;
          return { ...item, settings: { ...item.settings, video: newVid }, estimatedSize: est };
        })
      );
    }

    if (tool.actionType === 'resize' && tool.payload) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.type !== 'image') return item;
          const newImg = { ...item.settings.image, ...tool.payload };
          const est = item.originalWidth && item.originalHeight
            ? estimateImageSize(item.originalSize, item.originalWidth, item.originalHeight, newImg)
            : item.estimatedSize;
          return { ...item, settings: { ...item.settings, image: newImg }, estimatedSize: est };
        })
      );
    }

    addToast('info', `Opened Tool: ${tool.label}`, tool.description);
  };

  const handleUpdateSettings = (id: string, updatedSettings: Partial<MediaSettings>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const newSettings: MediaSettings = {
          ...item.settings,
          ...updatedSettings,
        };

        let newEstimatedSize: number | undefined = item.estimatedSize;
        if (item.type === 'image' && item.originalWidth && item.originalHeight) {
          newEstimatedSize = estimateImageSize(
            item.originalSize,
            item.originalWidth,
            item.originalHeight,
            newSettings.image
          );
        } else if (item.type === 'video' && item.duration) {
          newEstimatedSize = estimateVideoSize(item.originalSize, item.duration, newSettings.video);
        }

        return {
          ...item,
          settings: newSettings,
          estimatedSize: newEstimatedSize,
        };
      })
    );
  };

  const handleApplyGlobalImageFormat = (format: ImageFormat, quality: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type !== 'image') return item;
        const newImgSettings: ImageSettings = { ...item.settings.image, format, quality };
        const est = item.originalWidth && item.originalHeight
          ? estimateImageSize(item.originalSize, item.originalWidth, item.originalHeight, newImgSettings)
          : item.estimatedSize;
        return {
          ...item,
          settings: { ...item.settings, image: newImgSettings },
          estimatedSize: est,
        };
      })
    );
    addToast('info', 'Global Preset Applied', `Set all images to ${format.toUpperCase()} (${quality}% Quality)`);
  };

  const handleApplyGlobalVideoFormat = (format: 'mp4' | 'webm', preset: VideoPreset) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type !== 'video') return item;
        const newVidSettings: VideoSettings = { ...item.settings.video, format, preset };
        const est = item.duration
          ? estimateVideoSize(item.originalSize, item.duration, newVidSettings)
          : item.estimatedSize;
        return {
          ...item,
          settings: { ...item.settings, video: newVidSettings },
          estimatedSize: est,
        };
      })
    );
    addToast('info', 'Global Preset Applied', `Set all videos to ${format.toUpperCase()} (${preset === 'smaller_file' ? 'Smaller File H.265' : 'Compatible H.264'})`);
  };

  const processSingleItem = async (id: string): Promise<boolean> => {
    const item = items.find((i) => i.id === id);
    if (!item) return false;

    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, elapsedSeconds: elapsed } : i))
      );
    }, 1000);

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'processing', progress: 5, startTime, elapsedSeconds: 0, errorMessage: undefined } : i))
    );

    try {
      if (item.type === 'image') {
        const origW = item.originalWidth || 1920;
        const origH = item.originalHeight || 1080;
        
        const result = await processImage(item.file, item.settings.image, origW, origH);
        const compressedUrl = URL.createObjectURL(result.blob);
        const processingTimeMs = Date.now() - startTime;

        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  compressedBlob: result.blob,
                  compressedSize: result.blob.size,
                  compressedUrl,
                  compressedWidth: result.width,
                  compressedHeight: result.height,
                  processingTimeMs,
                }
              : i
          )
        );

        return true;
      } else {
        const result = await processVideo(
          item.file,
          item.settings.video,
          (prog) => {
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, progress: prog } : i))
            );
          },
          (status) => setFfmpegStatus(status)
        );

        const compressedUrl = URL.createObjectURL(result.blob);
        const processingTimeMs = Date.now() - startTime;

        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  compressedBlob: result.blob,
                  compressedSize: result.blob.size,
                  compressedUrl,
                  processingTimeMs,
                }
              : i
          )
        );

        return true;
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: 'error', progress: 0, errorMessage: err.message || 'Processing failed' }
            : i
        )
      );
      return false;
    } finally {
      clearInterval(timer);
    }
  };

  const handleCompressAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    setIsProcessing(true);
    setOverallProgress(0);

    let completedCount = 0;

    for (let i = 0; i < pending.length; i++) {
      const success = await processSingleItem(pending[i].id);
      if (success) completedCount++;
      setOverallProgress(Math.round(((i + 1) / pending.length) * 100));
    }

    setIsProcessing(false);

    if (completedCount > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      addToast('success', 'Batch Processing Complete!', `Successfully processed ${completedCount} file(s).`);
    } else {
      addToast('error', 'Batch Processing Failed', 'One or more files encountered errors.');
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      addToast('info', 'Packaging ZIP File...', 'Compressing all output files into archive');
      await downloadAllAsZip(items);
      addToast('success', 'ZIP Archive Downloaded!', 'All processed files saved to your computer.');
    } catch (err: any) {
      addToast('error', 'ZIP Download Failed', err.message);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    setItems([]);
    addToast('info', 'Queue Cleared');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#080B11] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLoadSamples={handleLoadSamples}
        onGoToHub={() => setActiveView('hub')}
        activeView={activeView}
        selectedToolName={selectedTool?.label}
        ffmpegStatus={ffmpegStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        
        {/* PAGE 1: ALL TOOLS HUB DIRECTORY */}
        {activeView === 'hub' && (
          <ToolsHub onSelectTool={handleSelectTool} />
        )}

        {/* PAGE 2: DEDICATED TOOL WORKSPACE */}
        {activeView === 'workspace' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {selectedTool && (
              <ToolWorkspaceHeader
                tool={selectedTool}
                onBackToHub={() => setActiveView('hub')}
              />
            )}

            <UploadZone onFilesSelected={handleFilesSelected} />

            <BatchToolbar
              items={items}
              isProcessing={isProcessing}
              overallProgress={overallProgress}
              onCompressAll={handleCompressAll}
              onDownloadAllZip={handleDownloadAllZip}
              onClearAll={handleClearAll}
              onApplyGlobalImageFormat={handleApplyGlobalImageFormat}
              onApplyGlobalVideoFormat={handleApplyGlobalVideoFormat}
            />

            {items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                  File Processing Queue ({items.length})
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {items.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onUpdateSettings={handleUpdateSettings}
                      onProcessItem={(id) => processSingleItem(id)}
                      onRemoveItem={handleRemoveItem}
                      onOpenComparison={(item) => setComparisonItem(item)}
                      onDownloadItem={(item) => downloadSingleFile(item)}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className="py-6 px-8 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300 space-y-1">
        <p>CrispCompress PRO • 100% Client-Side Private Media Compressor & Converter (Videos up to 1.5 GB)</p>
        <p className="font-medium text-slate-400 dark:text-slate-500">© 2026 UG_SIDHARTH. All rights reserved.</p>
      </footer>

      <ComparisonModal
        item={comparisonItem}
        onClose={() => setComparisonItem(null)}
        onDownload={(item) => downloadSingleFile(item)}
      />

      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
