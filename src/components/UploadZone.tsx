import React, { useRef, useState } from 'react';
import { Upload, Film, ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
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
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed ${
        isDragOver
          ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/10 scale-[1.01] shadow-2xl'
          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0E1322] hover:border-brand-500/50 hover:bg-slate-50 dark:hover:bg-[#12182B] shadow-xl'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        
        {/* Upload Icon Badge */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${
          isDragOver
            ? 'bg-brand-500 text-white shadow-brand-500/30'
            : 'bg-gradient-to-tr from-brand-500 to-rose-500 text-white shadow-rose-500/20'
        }`}>
          <Upload className="w-8 h-8" />
        </div>

        {/* Action Callout */}
        <div className="space-y-1 max-w-lg">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Drag & drop media files here, or <span className="text-brand-500 underline underline-offset-4">browse</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Upload single or multiple video & image files at once (Videos up to 1.5 GB)
          </p>
        </div>

        {/* Format Badges & Privacy Guarantee */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> Videos (MP4, MOV, AVI, MKV, WebM)
          </span>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Photos (JPG, PNG, WebP, GIF)
          </span>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Max Video Size: 1.5 GB
          </span>

          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser Private
          </span>
        </div>

      </div>
    </div>
  );
};
