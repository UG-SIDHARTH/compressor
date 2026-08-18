import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  MediaItem, MediaSettings, ImageFormat, VideoFormat, ImageSettings, VideoSettings 
} from './types/media';
import { getMediaTypeFromExtension, getFileExtension } from './utils/formatHelpers';
import { getImageDimensions, processImage, estimateImageSize } from './utils/imageProcessor';
import { getVideoMetadata, processVideo, estimateVideoSize, getFFmpeg } from './utils/videoProcessor';
import { downloadAllAsZip, downloadSingleFile } from './utils/zipPackager';
import { createSampleImageFiles } from './utils/sampleMedia';

import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { BatchToolbar } from './components/BatchToolbar';
import { MediaCard } from './components/MediaCard';
import { ComparisonModal } from './components/ComparisonModal';
import { ToastNotification } from './components/ToastNotification';
import type { ToastMessage } from './components/ToastNotification';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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
      const type = getMediaTypeFromExtension(file.name);
      if (type === 'unsupported') {
        addToast('error', 'Unsupported File Type', `${file.name} is not a supported image or video format.`);
        continue;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      const ext = getFileExtension(file.name);

      let originalWidth: number | undefined;
      let originalHeight: number | undefined;
      let duration: number | undefined;

      const defaultImageSettings: ImageSettings = {
        format: (['png', 'webp', 'gif'].includes(ext) ? ext : 'webp') as ImageFormat,
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
        quality: 'balanced',
        resolution: 'original',
      };

      if (type === 'image') {
        try {
          const dims = await getImageDimensions(file);
          originalWidth = dims.width;
          originalHeight = dims.height;
          defaultImageSettings.targetWidth = dims.width;
          defaultImageSettings.targetHeight = dims.height;
        } catch {
          // Fallback
        }
      } else if (type === 'video') {
        try {
          const meta = await getVideoMetadata(file);
          duration = meta.duration;
          originalWidth = meta.width;
          originalHeight = meta.height;
        } catch {
          // Fallback
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
      addToast('info', 'Loading Sample Media...', 'Generating high-res test images in memory');
      const sampleFiles = await createSampleImageFiles();
      await handleFilesSelected(sampleFiles);
    } catch (err: any) {
      addToast('error', 'Sample Loading Failed', err.message);
    }
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

  const handleApplyGlobalImageFormat = (format: 'webp' | 'jpeg' | 'png', quality: number) => {
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

  const handleApplyGlobalVideoFormat = (format: 'mp4' | 'webm', quality: 'balanced' | 'small_size') => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type !== 'video') return item;
        const newVidSettings: VideoSettings = { ...item.settings.video, format, quality };
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
    addToast('info', 'Global Preset Applied', `Set all videos to ${format.toUpperCase()} (${quality})`);
  };

  const processSingleItem = async (id: string): Promise<boolean> => {
    const item = items.find((i) => i.id === id);
    if (!item) return false;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'processing', progress: 5, errorMessage: undefined } : i))
    );

    try {
      if (item.type === 'image') {
        const origW = item.originalWidth || 1920;
        const origH = item.originalHeight || 1080;
        
        const result = await processImage(item.file, item.settings.image, origW, origH);
        const compressedUrl = URL.createObjectURL(result.blob);

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
      addToast('success', 'Batch Processing Complete!', `Successfully compressed ${completedCount} file(s).`);
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
    <div className="min-h-screen flex flex-col">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLoadSamples={handleLoadSamples}
        ffmpegStatus={ffmpegStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
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
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
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
      </main>

      <footer className="py-6 px-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>Compressify Studio • 100% Client-Side Private Media Compressor & Converter • Built with React & FFmpeg WASM</p>
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
