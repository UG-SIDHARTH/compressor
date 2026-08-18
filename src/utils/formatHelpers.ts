import type { ImageFormat, VideoFormat } from '../types/media';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateSpaceSaved(original: number, compressed: number): {
  bytesSaved: number;
  percentage: number;
  isSmaller: boolean;
} {
  const bytesSaved = original - compressed;
  const percentage = Math.round((bytesSaved / original) * 100);
  return {
    bytesSaved,
    percentage,
    isSmaller: bytesSaved > 0,
  };
}

export function getMimeType(format: ImageFormat | VideoFormat): string {
  const map: Record<string, string> = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
  };
  return map[format] || 'application/octet-stream';
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getMediaTypeFromExtension(filename: string): 'image' | 'video' | 'unsupported' {
  const ext = getFileExtension(filename);
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp', 'flv'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unsupported';
}
