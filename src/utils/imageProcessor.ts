import type { ImageSettings } from '../types/media';
import { PRESETS } from '../types/media';
import { getMimeType } from './formatHelpers';

export interface ImageDimensions {
  width: number;
  height: number;
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    
    img.src = url;
  });
}

export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  settings: ImageSettings
): ImageDimensions {
  const { resizeMode, targetWidth, targetHeight, scalePercentage, preset, maintainAspectRatio } = settings;
  const aspectRatio = originalWidth / originalHeight;

  if (resizeMode === 'percentage') {
    const scale = Math.max(10, Math.min(200, scalePercentage)) / 100;
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale),
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

  let finalWidth = targetWidth > 0 ? targetWidth : originalWidth;
  let finalHeight = targetHeight > 0 ? targetHeight : originalHeight;

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
  const pixelRatio = (targetW * targetH) / (originalWidth * originalHeight);
  const q = settings.quality / 100;

  let formatFactor = 1.0;
  if (settings.format === 'webp') {
    formatFactor = 0.55 + q * 0.35;
  } else if (settings.format === 'jpeg') {
    formatFactor = 0.6 + q * 0.4;
  } else if (settings.format === 'png') {
    formatFactor = 0.95;
  } else if (settings.format === 'gif') {
    formatFactor = 0.85;
  }

  const estimated = Math.round(originalSize * pixelRatio * formatFactor);
  return Math.max(1024, Math.min(estimated, originalSize * 1.5));
}

export async function processImage(
  file: File,
  settings: ImageSettings,
  originalWidth: number,
  originalHeight: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const targetDims = calculateTargetDimensions(originalWidth, originalHeight, settings);
  const imgBitmap = await createImageBitmap(file);
  
  const canvas = document.createElement('canvas');
  canvas.width = targetDims.width;
  canvas.height = targetDims.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context could not be created');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (settings.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(imgBitmap, 0, 0, targetDims.width, targetDims.height);
  
  const mimeType = getMimeType(settings.format);
  const qualityVal = settings.quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        imgBitmap.close();
        if (blob) {
          resolve({
            blob,
            width: targetDims.width,
            height: targetDims.height,
          });
        } else {
          reject(new Error('Failed to generate image blob from canvas'));
        }
      },
      mimeType,
      qualityVal
    );
  });
}
