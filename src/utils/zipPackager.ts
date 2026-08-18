import JSZip from 'jszip';
import type { MediaItem } from '../types/media';

/**
 * Packs all completed MediaItems into a single downloadable .ZIP archive
 */
export async function downloadAllAsZip(
  items: MediaItem[],
  onProgress?: (progress: number) => void
): Promise<void> {
  const completedItems = items.filter(item => item.status === 'completed' && item.compressedBlob);
  
  if (completedItems.length === 0) {
    throw new Error('No completed files available to download in ZIP archive.');
  }

  const zip = new JSZip();
  const folder = zip.folder('compressify_export');

  if (!folder) {
    throw new Error('Failed to create ZIP folder.');
  }

  const usedNames = new Set<string>();

  completedItems.forEach((item) => {
    if (!item.compressedBlob) return;

    // Remove extension & illegal filename characters
    const cleanBaseName = item.name
      .substring(0, item.name.lastIndexOf('.'))
      .replace(/[/\\?%*:|"<>]/g, '_') || 'media_file';

    const targetExt = item.type === 'image' 
      ? item.settings.image.format 
      : item.settings.video.format;

    let exportFileName = `${cleanBaseName}_compressed.${targetExt}`;
    let counter = 1;

    while (usedNames.has(exportFileName)) {
      exportFileName = `${cleanBaseName}_compressed_${counter}.${targetExt}`;
      counter++;
    }

    usedNames.add(exportFileName);
    folder.file(exportFileName, item.compressedBlob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(Math.round(metadata.percent));
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFileName = `compressify_export_${dateStr}.zip`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

/**
 * Downloads a single processed item safely
 */
export function downloadSingleFile(item: MediaItem): void {
  if (!item.compressedBlob) return;

  const cleanBaseName = item.name
    .substring(0, item.name.lastIndexOf('.'))
    .replace(/[/\\?%*:|"<>]/g, '_') || 'media_file';

  const targetExt = item.type === 'image' 
    ? item.settings.image.format 
    : item.settings.video.format;

  const downloadName = `${cleanBaseName}_compressed.${targetExt}`;
  
  const link = document.createElement('a');
  link.href = item.compressedUrl || URL.createObjectURL(item.compressedBlob);
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
