import type { ImageSettings } from '../types/media';
import { PRESETS } from '../types/media';
import { getMimeType } from './formatHelpers';

export interface ImageDimensions {
  width: number;
  height: number;
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (file.size === 0) {
      return reject(new Error('Image file is empty (0 bytes).'));
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width || 800, height: img.height || 600 });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. File may be corrupted or invalid format.'));
    };
    
    img.src = url;
  });
}

export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  settings: ImageSettings
): ImageDimensions {
  const origW = originalWidth > 0 ? originalWidth : 1000;
  const origH = originalHeight > 0 ? originalHeight : 1000;
  const aspectRatio = origW / origH;

  const { resizeMode, targetWidth, targetHeight, scalePercentage, preset, maintainAspectRatio } = settings;

  if (resizeMode === 'percentage') {
    const scale = Math.max(10, Math.min(200, scalePercentage || 100)) / 100;
    return {
      width: Math.max(1, Math.round(origW * scale)),
      height: Math.max(1, Math.round(origH * scale)),
    };
  }

  if (resizeMode === 'preset') {
    const presetConfig = PRESETS[preset];
    if (presetConfig) {
      if (maintainAspectRatio) {
        let w = presetConfig.width;
        let h = presetConfig.height;
        if (w / h > aspectRatio) {
          w = Math.round(h * aspectRatio);
        } else {
          h = Math.round(w / aspectRatio);
        }
        return { width: Math.max(1, w), height: Math.max(1, h) };
      }
      return { width: presetConfig.width, height: presetConfig.height };
    }
  }

  let finalWidth = targetWidth > 0 ? targetWidth : origW;
  let finalHeight = targetHeight > 0 ? targetHeight : origH;

  if (maintainAspectRatio) {
    if (targetWidth > 0 && (!targetHeight || targetHeight <= 0)) {
      finalHeight = Math.round(targetWidth / aspectRatio);
    } else if (targetHeight > 0 && (!targetWidth || targetWidth <= 0)) {
      finalWidth = Math.round(targetHeight * aspectRatio);
    }
  }

  return {
    width: Math.max(1, finalWidth),
    height: Math.max(1, finalHeight),
  };
}

export function estimateImageSize(
  originalSize: number,
  originalWidth: number,
  originalHeight: number,
  settings: ImageSettings
): number {
  const { width: targetW, height: targetH } = calculateTargetDimensions(originalWidth, originalHeight, settings);
  const origW = originalWidth > 0 ? originalWidth : 1;
  const origH = originalHeight > 0 ? originalHeight : 1;
  const pixelRatio = (targetW * targetH) / (origW * origH);
  const q = (settings.quality || 80) / 100;

  let formatFactor = 1.0;
  if (settings.format === 'webp') {
    formatFactor = 0.5 + q * 0.35;
  } else if (settings.format === 'jpeg') {
    formatFactor = 0.55 + q * 0.4;
  } else if (settings.format === 'png') {
    formatFactor = 0.9;
  } else if (settings.format === 'gif') {
    formatFactor = 0.85;
  }

  const estimated = Math.round(originalSize * pixelRatio * formatFactor);
  return Math.max(1024, Math.min(estimated, originalSize * 1.5));
}

/**
 * Compress, resize, and convert image with browser fallback handling for GIF
 */
export async function processImage(
  file: File,
  settings: ImageSettings,
  originalWidth: number,
  originalHeight: number
): Promise<{ blob: Blob; width: number; height: number }> {
  if (file.size === 0) {
    throw new Error('Image file is empty (0 bytes). Cannot process.');
  }

  const targetDims = calculateTargetDimensions(originalWidth, originalHeight, settings);
  
  let imgBitmap: ImageBitmap | null = null;
  try {
    imgBitmap = await createImageBitmap(file);
  } catch (err: any) {
    throw new Error(`Failed to decode image: ${err?.message || 'Corrupted or unsupported image file'}`);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = targetDims.width;
  canvas.height = targetDims.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    imgBitmap.close();
    throw new Error('Canvas 2D context creation failed.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (settings.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(imgBitmap, 0, 0, targetDims.width, targetDims.height);
  imgBitmap.close();
  
  // Browsers don't support canvas.toBlob('image/gif') export natively; fallback to PNG/JPEG
  let mimeType = getMimeType(settings.format);
  if (settings.format === 'gif') {
    mimeType = 'image/png'; // PNG fallback for canvas gif export
  }

  const qualityVal = (settings.quality || 80) / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({
            blob,
            width: targetDims.width,
            height: targetDims.height,
          });
        } else {
          // Fallback to image/png if toBlob fails
          canvas.toBlob((fallbackBlob) => {
            if (fallbackBlob) {
              resolve({
                blob: fallbackBlob,
                width: targetDims.width,
                height: targetDims.height,
              });
            } else {
              reject(new Error('Failed to generate image blob from canvas.'));
            }
          }, 'image/png');
        }
      },
      mimeType,
      qualityVal
    );
  });
}
