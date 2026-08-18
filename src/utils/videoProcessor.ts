import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoSettings, VideoQuality } from '../types/media';

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoading = false;
let ffmpegLoaded = false;

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Extract metadata (duration, width, height) with a 4-second timeout guard
 */
export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ duration: 0, width: 1280, height: 720 });
      }
    }, 4000);

    video.onloadedmetadata = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        const meta = {
          duration: video.duration || 0,
          width: video.videoWidth || 1280,
          height: video.videoHeight || 720,
        };
        cleanup();
        resolve(meta);
      }
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve({ duration: 0, width: 1280, height: 720 });
      }
    };

    video.src = url;
  });
}

/**
 * Gets or initializes singleton FFmpeg instance using ESM core
 */
export async function getFFmpeg(onStatusUpdate?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isFFmpegLoading) {
    while (isFFmpegLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    if (ffmpegInstance && ffmpegLoaded) return ffmpegInstance;
  }

  isFFmpegLoading = true;
  const errors: string[] = [];

  // Method 1: Local direct ESM URL (Fastest & 100% offline)
  try {
    onStatusUpdate?.('Loading local FFmpeg WASM engine...');
    const ffmpeg = new FFmpeg();
    
    const localJS = `${window.location.origin}/ffmpeg/ffmpeg-core.js`;
    const localWasm = `${window.location.origin}/ffmpeg/ffmpeg-core.wasm`;

    await ffmpeg.load({
      coreURL: localJS,
      wasmURL: await toBlobURL(localWasm, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    isFFmpegLoading = false;
    onStatusUpdate?.('FFmpeg WASM ready!');
    return ffmpeg;
  } catch (err: any) {
    const msg = `Local load failed: ${err?.message || err}`;
    console.warn(msg, err);
    errors.push(msg);
  }

  // Method 2: Local direct WASM URL
  try {
    onStatusUpdate?.('Loading local FFmpeg WASM direct...');
    const ffmpeg = new FFmpeg();
    
    const localJS = `${window.location.origin}/ffmpeg/ffmpeg-core.js`;
    const localWasm = `${window.location.origin}/ffmpeg/ffmpeg-core.wasm`;

    await ffmpeg.load({
      coreURL: localJS,
      wasmURL: localWasm,
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    isFFmpegLoading = false;
    onStatusUpdate?.('FFmpeg WASM ready!');
    return ffmpeg;
  } catch (err: any) {
    const msg = `Local direct WASM load failed: ${err?.message || err}`;
    console.warn(msg, err);
    errors.push(msg);
  }

  // Method 3: jsDelivr ESM CDN
  try {
    onStatusUpdate?.('Loading FFmpeg engine from jsDelivr CDN...');
    const ffmpeg = new FFmpeg();
    const cdnBase = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: `${cdnBase}/ffmpeg-core.js`,
      wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    isFFmpegLoading = false;
    onStatusUpdate?.('FFmpeg WASM ready!');
    return ffmpeg;
  } catch (err: any) {
    const msg = `jsDelivr CDN load failed: ${err?.message || err}`;
    console.warn(msg, err);
    errors.push(msg);
  }

  isFFmpegLoading = false;
  const detailedError = `Failed to load FFmpeg video encoder. Details:\n${errors.join('\n')}`;
  console.error(detailedError);
  throw new Error(detailedError);
}

export function estimateVideoSize(
  originalSize: number,
  duration: number,
  settings: VideoSettings
): number {
  if (!duration || duration <= 0) return Math.round(originalSize * 0.75);

  let targetBitrateKbps = 2000;

  switch (settings.quality) {
    case 'high_quality':
      targetBitrateKbps = 3500;
      break;
    case 'balanced':
      targetBitrateKbps = 2000;
      break;
    case 'small_size':
      targetBitrateKbps = 1000;
      break;
    case 'maximum_compression':
      targetBitrateKbps = 500;
      break;
  }

  if (settings.resolution === '1080p') targetBitrateKbps = Math.min(targetBitrateKbps, 2800);
  if (settings.resolution === '720p') targetBitrateKbps = Math.min(targetBitrateKbps, 1500);
  if (settings.resolution === '480p') targetBitrateKbps = Math.min(targetBitrateKbps, 800);

  const estimatedBytes = Math.round(((targetBitrateKbps * 1000) / 8) * duration);
  return Math.max(1024 * 50, Math.min(estimatedBytes, originalSize));
}

function getCRF(quality: VideoQuality): number {
  switch (quality) {
    case 'high_quality':
      return 20;
    case 'balanced':
      return 26;
    case 'small_size':
      return 32;
    case 'maximum_compression':
      return 38;
    default:
      return 26;
  }
}

function getWebMBitrate(quality: VideoQuality): string {
  switch (quality) {
    case 'high_quality':
      return '3M';
    case 'balanced':
      return '1.5M';
    case 'small_size':
      return '800k';
    case 'maximum_compression':
      return '400k';
    default:
      return '1.5M';
  }
}

/**
 * Process a Video file using client-side FFmpeg WASM
 */
export async function processVideo(
  file: File,
  settings: VideoSettings,
  onProgress: (progress: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<{ blob: Blob; format: string }> {
  if (file.size === 0) {
    throw new Error('Video file is empty (0 bytes). Cannot process.');
  }

  const ffmpeg = await getFFmpeg(onStatusUpdate);

  const inputExt = file.name.split('.').pop() || 'mp4';
  const timestamp = Date.now();
  const inputFileName = `input_${timestamp}.${inputExt}`;
  const outputFileName = `output_${timestamp}.${settings.format}`;

  onStatusUpdate?.('Writing video file to virtual memory...');
  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  const args: string[] = ['-i', inputFileName];

  // Scale filter calculation
  if (settings.resolution !== 'original') {
    let scaleFilter = 'scale=-2:1080';
    if (settings.resolution === '720p') scaleFilter = 'scale=-2:720';
    if (settings.resolution === '480p') scaleFilter = 'scale=-2:480';
    args.push('-vf', scaleFilter);
  }

  const crf = getCRF(settings.quality);

  if (settings.format === 'mp4' || settings.format === 'mov') {
    args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k');
  } else if (settings.format === 'webm') {
    const bitrate = getWebMBitrate(settings.quality);
    args.push('-c:v', 'libvpx', '-crf', crf.toString(), '-b:v', bitrate, '-c:a', 'libvorbis');
  } else if (settings.format === 'mkv' || settings.format === 'avi') {
    args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', 'ultrafast', '-c:a', 'aac');
  }

  args.push('-y', outputFileName);

  const ffmpegLogs: string[] = [];

  const logHandler = ({ message }: { type: string; message: string }) => {
    if (message) {
      ffmpegLogs.push(message);
      console.log('[FFmpeg Log]', message);
    }
  };

  const progressHandler = ({ progress }: { progress: number }) => {
    const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
    onProgress(percentage);
  };

  ffmpeg.on('log', logHandler);
  ffmpeg.on('progress', progressHandler);

  onStatusUpdate?.('Compressing and encoding video...');
  
  try {
    await ffmpeg.exec(args);
    
    onStatusUpdate?.('Reading processed video file...');
    const data = await ffmpeg.readFile(outputFileName);
    
    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
    };

    const uint8 = new Uint8Array(data as Uint8Array);
    const outputBlob = new Blob([uint8], { type: mimeMap[settings.format] || 'video/mp4' });
    onProgress(100);
    return { blob: outputBlob, format: settings.format };
  } catch (err: any) {
    const recentLogs = ffmpegLogs.slice(-4).join(' | ');
    console.error('FFmpeg execution error:', err, 'Logs:', recentLogs);
    throw new Error(`Video encoding failed: ${recentLogs || err.message || 'Unknown processing error'}`);
  } finally {
    // Always cleanup Virtual FS files to prevent WASM memory leaks
    await ffmpeg.deleteFile(inputFileName).catch(() => {});
    await ffmpeg.deleteFile(outputFileName).catch(() => {});
    ffmpeg.off('log', logHandler);
    ffmpeg.off('progress', progressHandler);
  }
}
