export type MediaType = 'image' | 'video' | 'unsupported';

export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'gif';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv';

export type ImageResizeMode = 'custom' | 'percentage' | 'preset';
export type SocialPreset = 'instagram_post' | 'instagram_story' | 'youtube_thumb' | 'hd_1080p' | 'avatar';

export type VideoQuality = 'high_quality' | 'balanced' | 'small_size' | 'maximum_compression';
export type VideoResolution = 'original' | '1080p' | '720p' | '480p';

export interface ImageSettings {
  format: ImageFormat;
  quality: number; // 1-100
  resizeMode: ImageResizeMode;
  targetWidth: number;
  targetHeight: number;
  scalePercentage: number;
  preset: SocialPreset;
  maintainAspectRatio: boolean;
}

export interface VideoSettings {
  format: VideoFormat;
  quality: VideoQuality;
  resolution: VideoResolution;
}

export interface MediaSettings {
  image: ImageSettings;
  video: VideoSettings;
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface MediaItem {
  id: string;
  file: File;
  name: string;
  type: MediaType;
  originalSize: number;
  originalFormat: string;
  originalWidth?: number;
  originalHeight?: number;
  duration?: number; // Video duration in seconds
  previewUrl?: string;
  status: ProcessingStatus;
  progress: number;
  estimatedSize?: number;
  settings: MediaSettings;
  
  // Results
  compressedBlob?: Blob;
  compressedSize?: number;
  compressedUrl?: string;
  compressedWidth?: number;
  compressedHeight?: number;
  errorMessage?: string;

  // Processing Timing Stats
  startTime?: number;
  elapsedSeconds?: number;
  processingTimeMs?: number;
}

export const PRESETS: Record<SocialPreset, { label: string; width: number; height: number }> = {
  instagram_post: { label: 'Instagram Square (1080 × 1080)', width: 1080, height: 1080 },
  instagram_story: { label: 'Instagram Story/Reel (1080 × 1920)', width: 1080, height: 1920 },
  youtube_thumb: { label: 'YouTube Thumbnail (1280 × 720)', width: 1280, height: 720 },
  hd_1080p: { label: 'Full HD (1920 × 1080)', width: 1920, height: 1080 },
  avatar: { label: 'Profile Avatar (400 × 400)', width: 400, height: 400 },
};
