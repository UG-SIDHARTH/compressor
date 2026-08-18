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

export function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration || 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read video metadata'));
    };

    video.src = url;
  });
}

/**
 * Gets or initializes singleton FFmpeg instance using direct ESM HTTP URLs
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

  // Method 4: unpkg ESM CDN
  try {
    onStatusUpdate?.('Loading FFmpeg engine from unpkg CDN...');
    const ffmpeg = new FFmpeg();
    const unpkgBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: `${unpkgBase}/ffmpeg-core.js`,
      wasmURL: await toBlobURL(`${unpkgBase}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    ffmpegLoaded = true;
    isFFmpegLoading = false;
    onStatusUpdate?.('FFmpeg WASM ready!');
    return ffmpeg;
  } catch (err: any) {
    const msg = `unpkg CDN load failed: ${err?.message || err}`;
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
  if (!duration || duration <= 0) return Math.round(originalSize * 0.7);

  let targetBitrateKbps = 2500;

  switch (settings.quality) {
    case 'high_quality':
      targetBitrateKbps = 4500;
      break;
    case 'balanced':
      targetBitrateKbps = 2500;
      break;
    case 'small_size':
      targetBitrateKbps = 1200;
      break;
    case 'maximum_compression':
      targetBitrateKbps = 600;
      break;
  }

  if (settings.resolution === '1080p') targetBitrateKbps = Math.min(targetBitrateKbps, 3500);
  if (settings.resolution === '720p') targetBitrateKbps = Math.min(targetBitrateKbps, 2000);
  if (settings.resolution === '480p') targetBitrateKbps = Math.min(targetBitrateKbps, 1000);

  const estimatedBytes = Math.round(((targetBitrateKbps * 1000) / 8) * duration);
  return Math.max(1024 * 100, Math.min(estimatedBytes, originalSize));
}

function getCRF(quality: VideoQuality): number {
  switch (quality) {
    case 'high_quality':
      return 18;
    case 'balanced':
      return 24;
    case 'small_size':
      return 30;
    case 'maximum_compression':
      return 36;
    default:
      return 24;
  }
}

export async function processVideo(
  file: File,
  settings: VideoSettings,
  onProgress: (progress: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<{ blob: Blob; format: string }> {
  const ffmpeg = await getFFmpeg(onStatusUpdate);

  const inputExt = file.name.split('.').pop() || 'mp4';
  const inputFileName = `input_${Date.now()}.${inputExt}`;
  const outputFileName = `output_${Date.now()}.${settings.format}`;

  onStatusUpdate?.('Writing video file to virtual memory...');
  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  const args: string[] = ['-i', inputFileName];

  if (settings.resolution !== 'original') {
    let scaleFilter = 'scale=-2:1080';
    if (settings.resolution === '720p') scaleFilter = 'scale=-2:720';
    if (settings.resolution === '480p') scaleFilter = 'scale=-2:480';
    args.push('-vf', scaleFilter);
  }

  const crf = getCRF(settings.quality);

  if (settings.format === 'mp4' || settings.format === 'mov') {
    args.push('-c:v', 'libx264', '-crf', crf.toString(), '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k');
  } else if (settings.format === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-crf', crf.toString(), '-b:v', '0', '-c:a', 'libopus');
  } else if (settings.format === 'mkv' || settings.format === 'avi') {
    args.push('-c:v', 'libx264', '-crf', crf.toString(), '-c:a', 'aac');
  }

  args.push('-y', outputFileName);

  const progressHandler = ({ progress }: { progress: number }) => {
    const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
    onProgress(percentage);
  };

  ffmpeg.on('progress', progressHandler);

  onStatusUpdate?.('Compressing and encoding video...');
  
  try {
    await ffmpeg.exec(args);
    
    onStatusUpdate?.('Reading processed video file...');
    const data = await ffmpeg.readFile(outputFileName);
    
    await ffmpeg.deleteFile(inputFileName).catch(() => {});
    await ffmpeg.deleteFile(outputFileName).catch(() => {});
    
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
    console.error('FFmpeg execution error:', err);
    throw new Error(`Video encoding failed: ${err.message || 'Unknown processing error'}`);
  } finally {
    ffmpeg.off('progress', progressHandler);
  }
}
