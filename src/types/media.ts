export type MediaType = 'image' | 'video';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif';
export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'mkv';

export type VideoQuality = 'high_quality' | 'balanced' | 'small_size' | 'maximum_compression';

export type ResizeMode = 'custom' | 'percentage' | 'preset';

export type PresetDimension = 
  | 'instagram_post' // 1080x1080
  | 'instagram_story' // 1080x1920
  | 'twitter_post' // 1200x675
  | 'youtube_thumb' // 1280x720
  | 'fhd' // 1920x1080
  | 'hd' // 1280x720
  | 'avatar'; // 400x400

export type ProcessingStatus = 'idle' | 'estimating' | 'processing' | 'completed' | 'error';

export interface ImageSettings {
  format: ImageFormat;
  quality: number; // 1 - 100
  resizeMode: ResizeMode;
  targetWidth: number;
  targetHeight: number;
  scalePercentage: number; // 10 - 200
  preset: PresetDimension;
  maintainAspectRatio: boolean;
}

export interface VideoSettings {
  format: VideoFormat;
  quality: VideoQuality;
  resolution: 'original' | '1080p' | '720p' | '480p';
}

export interface MediaSettings {
  image: ImageSettings;
  video: VideoSettings;
}

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
  previewUrl: string;
  
  // Output result
  compressedBlob?: Blob;
  compressedSize?: number;
  compressedUrl?: string;
  compressedWidth?: number;
  compressedHeight?: number;
  
  // States
  status: ProcessingStatus;
  progress: number; // 0 - 100
  estimatedSize?: number;
  errorMessage?: string;
  
  // Individual Settings
  settings: MediaSettings;
}

export interface PresetDetails {
  id: PresetDimension;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const PRESETS: Record<PresetDimension, PresetDetails> = {
  instagram_post: { id: 'instagram_post', label: 'Instagram Square', width: 1080, height: 1080, description: '1080 × 1080 px' },
  instagram_story: { id: 'instagram_story', label: 'Story / Reel / Shorts', width: 1080, height: 1920, description: '1080 × 1920 px' },
  twitter_post: { id: 'twitter_post', label: 'Twitter / X Header/Post', width: 1200, height: 675, description: '1200 × 675 px' },
  youtube_thumb: { id: 'youtube_thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, description: '1280 × 720 px' },
  fhd: { id: 'fhd', label: 'Full HD 1080p', width: 1920, height: 1080, description: '1920 × 1080 px' },
  hd: { id: 'hd', label: 'HD 720p', width: 1280, height: 720, description: '1280 × 720 px' },
  avatar: { id: 'avatar', label: 'Square Avatar / Logo', width: 400, height: 400, description: '400 × 400 px' },
};
