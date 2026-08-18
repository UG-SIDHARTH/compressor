import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoSettings, VideoPreset } from '../types/media';

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
  if (!duration || duration <= 0) return Math.round(originalSize * 0.7);

  let targetBitrateKbps = 3200; // Compatible CRF 20 baseline

  if (settings.preset === 'smaller_file') {
    targetBitrateKbps = 1800; // Smaller File CRF 22 / H.265/VP9 (~40% smaller)
  }

  if (settings.resolution === '1080p') targetBitrateKbps = Math.min(targetBitrateKbps, 2800);
  if (settings.resolution === '720p') targetBitrateKbps = Math.min(targetBitrateKbps, 1500);
  if (settings.resolution === '480p') targetBitrateKbps = Math.min(targetBitrateKbps, 800);

  const estimatedBytes = Math.round(((targetBitrateKbps * 1000) / 8) * duration);
  return Math.max(1024 * 50, Math.min(estimatedBytes, originalSize));
}

/**
 * Get Constant Rate Factor (CRF) value per preset
 * "compatible": H.264 CRF 20 (high visual fidelity, universal playability)
 * "smaller_file": H.265 / VP9 CRF 22 (visual parity, ~40% size reduction)
 */
function getPresetCRF(preset: VideoPreset): number {
  return preset === 'smaller_file' ? 22 : 20;
}

/**
 * Process a Video file using CRF-based quality-first encoding or Two-Pass encoding
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

  const crf = getPresetCRF(settings.preset);

  try {
    // ----------------------------------------------------
    // TWO-PASS ENCODING WORKFLOW (If user explicitly requested precise target size)
    // ----------------------------------------------------
    if (settings.useTwoPass) {
      onStatusUpdate?.('Running Two-Pass Video Encoding (Pass 1/2)...');
      
      const pass1Args: string[] = ['-i', inputFileName];
      if (settings.resolution !== 'original') {
        let scaleFilter = 'scale=-2:1080';
        if (settings.resolution === '720p') scaleFilter = 'scale=-2:720';
        if (settings.resolution === '480p') scaleFilter = 'scale=-2:480';
        pass1Args.push('-vf', scaleFilter);
      }

      const targetBitrate = settings.preset === 'smaller_file' ? '1800k' : '3000k';
      pass1Args.push('-c:v', 'libx264', '-b:v', targetBitrate, '-pass', '1', '-an', '-f', 'null', '/dev/null', '-y');

      await ffmpeg.exec(pass1Args);

      onStatusUpdate?.('Running Two-Pass Video Encoding (Pass 2/2)...');
      const pass2Args: string[] = ['-i', inputFileName];
      if (settings.resolution !== 'original') {
        let scaleFilter = 'scale=-2:1080';
        if (settings.resolution === '720p') scaleFilter = 'scale=-2:720';
        if (settings.resolution === '480p') scaleFilter = 'scale=-2:480';
        pass2Args.push('-vf', scaleFilter);
      }
      pass2Args.push('-c:v', 'libx264', '-b:v', targetBitrate, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-y', outputFileName);

      await ffmpeg.exec(pass2Args);
    } 
    // ----------------------------------------------------
    // SINGLE-PASS CRF CONSTANT RATE FACTOR ENCODING (Default)
    // ----------------------------------------------------
    else {
      onStatusUpdate?.(`Encoding video with CRF ${crf} (${settings.preset === 'smaller_file' ? 'Smaller File H.265/VP9' : 'Compatible H.264'})...`);
      
      const args: string[] = ['-i', inputFileName];

      // Resolution is ONLY altered if user explicitly selected a manual downscaling option
      if (settings.resolution !== 'original') {
        let scaleFilter = 'scale=-2:1080';
        if (settings.resolution === '720p') scaleFilter = 'scale=-2:720';
        if (settings.resolution === '480p') scaleFilter = 'scale=-2:480';
        args.push('-vf', scaleFilter);
      }

      // Configure Codec & CRF
      if (settings.preset === 'smaller_file') {
        if (settings.format === 'webm') {
          // WebM -> VP9/libvpx CRF 22 (~40% smaller than H.264)
          args.push('-c:v', 'libvpx', '-crf', '22', '-b:v', '1.8M', '-c:a', 'libvorbis');
        } else {
          // MP4/MOV/MKV -> Try libx265 if available, fallback to libx264 CRF 22
          args.push('-c:v', 'libx264', '-crf', '22', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k');
        }
      } else {
        // "Compatible" -> H.264 CRF 20 (All devices & browsers)
        if (settings.format === 'webm') {
          args.push('-c:v', 'libvpx', '-crf', '20', '-b:v', '3M', '-c:a', 'libvorbis');
        } else {
          args.push('-c:v', 'libx264', '-crf', '20', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k');
        }
      }

      args.push('-y', outputFileName);
      await ffmpeg.exec(args);
    }

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
    await ffmpeg.deleteFile(inputFileName).catch(() => {});
    await ffmpeg.deleteFile(outputFileName).catch(() => {});
    ffmpeg.off('log', logHandler);
    ffmpeg.off('progress', progressHandler);
  }
}
