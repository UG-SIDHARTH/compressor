import React, { useRef, useState } from 'react';
import { UploadCloud, Film, Image as ImageIcon, PlusCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${
        isDragOver
          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01] shadow-2xl shadow-brand-500/10'
          : 'border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 shadow-md'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.mp4,.mov,.avi,.mkv,.webm,.jpg,.jpeg,.png,.webp,.gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
            isDragOver
              ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/30'
              : 'bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
          }`}
        >
          <UploadCloud className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {isDragOver ? 'Drop your files here!' : 'Drag & drop media files here'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            or <span className="text-brand-600 dark:text-brand-400 font-semibold underline underline-offset-2">click to browse</span> from your device
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-xl mx-auto">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Film className="w-3.5 h-3.5" />
            <span>Video: MP4, MOV, AVI, MKV, WEBM</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo: JPG, PNG, WEBP, GIF</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Batch support: Select multiple files at once</span>
        </div>
      </div>
    </div>
  );
};
