import React, { useState } from 'react';
import { 
  Minimize2, Image as ImageIcon, Film, FileVideo, Sparkles, Scale, 
  Search, Instagram, Youtube, Twitter, Zap, Archive, CheckCircle2, Sliders, ArrowRight
} from 'lucide-react';

interface ToolAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string; // Tailwind background & text color classes
  badge?: string;
  actionType: 'preset_image' | 'preset_video' | 'resize' | 'sample';
  payload?: any;
}

interface ToolCategory {
  title: string;
  tools: ToolAction[];
}

interface ToolsHubProps {
  onSelectTool: (tool: ToolAction) => void;
  onSearchChange?: (query: string) => void;
}

export const TOOLS_CATEGORIES: ToolCategory[] = [
  {
    title: 'OPTIMIZE MEDIA',
    tools: [
      {
        id: 'compress_video_balanced',
        label: 'Compress Video (Balanced)',
        description: 'Reduce MP4/MOV size with optimal quality balance',
        icon: <Film className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        actionType: 'preset_video',
        payload: { format: 'mp4', quality: 'balanced' },
      },
      {
        id: 'compress_photo_webp',
        label: 'Compress Photo to WebP',
        description: 'Ultra-high reduction using next-gen WebP',
        icon: <ImageIcon className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        actionType: 'preset_image',
        payload: { format: 'webp', quality: 80 },
      },
      {
        id: 'compress_max_video',
        label: 'Maximum Video Shrink',
        description: 'Smallest file size target for email/discord',
        icon: <Minimize2 className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        badge: 'SMALL',
        actionType: 'preset_video',
        payload: { format: 'mp4', quality: 'maximum_compression' },
      },
      {
        id: 'compress_jpeg_standard',
        label: 'JPG Compression',
        description: 'Optimize JPEG photos at 75% quality',
        icon: <Sliders className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        actionType: 'preset_image',
        payload: { format: 'jpeg', quality: 75 },
      },
    ],
  },
  {
    title: 'CONVERT VIDEO',
    tools: [
      {
        id: 'mov_to_mp4',
        label: 'MOV to MP4',
        description: 'Convert Apple QuickTime MOV videos to MP4',
        icon: <FileVideo className="w-4 h-4" />,
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        actionType: 'preset_video',
        payload: { format: 'mp4', quality: 'balanced' },
      },
      {
        id: 'convert_webm',
        label: 'Convert to WebM',
        description: 'High-efficiency VP9 video format for web',
        icon: <Film className="w-4 h-4" />,
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        actionType: 'preset_video',
        payload: { format: 'webm', quality: 'balanced' },
      },
      {
        id: 'convert_mkv',
        label: 'MKV to MP4',
        description: 'Transcode MKV video files to universal MP4',
        icon: <FileVideo className="w-4 h-4" />,
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        actionType: 'preset_video',
        payload: { format: 'mp4', quality: 'balanced' },
      },
    ],
  },
  {
    title: 'CONVERT PHOTO',
    tools: [
      {
        id: 'png_to_webp',
        label: 'PNG to WebP',
        description: 'Convert PNG graphics to 60% smaller WebP',
        icon: <ImageIcon className="w-4 h-4" />,
        iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        actionType: 'preset_image',
        payload: { format: 'webp', quality: 85 },
      },
      {
        id: 'convert_jpg',
        label: 'Convert to JPG',
        description: 'Export photos into standardized JPEG format',
        icon: <ImageIcon className="w-4 h-4" />,
        iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        actionType: 'preset_image',
        payload: { format: 'jpeg', quality: 85 },
      },
      {
        id: 'convert_png',
        label: 'Convert to PNG',
        description: 'Lossless image conversion with transparency',
        icon: <ImageIcon className="w-4 h-4" />,
        iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        actionType: 'preset_image',
        payload: { format: 'png', quality: 100 },
      },
    ],
  },
  {
    title: 'PHOTO RESIZE & PRESETS',
    tools: [
      {
        id: 'ig_square',
        label: 'Instagram Square',
        description: 'Resize image to 1080 × 1080 px post dimension',
        icon: <Instagram className="w-4 h-4" />,
        iconBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        actionType: 'resize',
        payload: { resizeMode: 'preset', preset: 'instagram_post' },
      },
      {
        id: 'ig_story',
        label: 'Story / Reel / Shorts',
        description: 'Resize to 1080 × 1920 px vertical format',
        icon: <Instagram className="w-4 h-4" />,
        iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        actionType: 'resize',
        payload: { resizeMode: 'preset', preset: 'instagram_story' },
      },
      {
        id: 'youtube_thumb',
        label: 'YouTube Thumbnail',
        description: 'Resize photo to 1280 × 720 px HD thumbnail',
        icon: <Youtube className="w-4 h-4" />,
        iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
        actionType: 'resize',
        payload: { resizeMode: 'preset', preset: 'youtube_thumb' },
      },
      {
        id: 'scale_50',
        label: '50% Scale Down',
        description: 'Halve dimensions for quick lightweight sharing',
        icon: <Scale className="w-4 h-4" />,
        iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        actionType: 'resize',
        payload: { resizeMode: 'percentage', scalePercentage: 50 },
      },
    ],
  },
  {
    title: 'BATCH & UTILITIES',
    tools: [
      {
        id: 'load_samples',
        label: 'Try Sample Files',
        description: 'Instantly generate 2K test media in memory',
        icon: <Sparkles className="w-4 h-4" />,
        iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        badge: 'DEMO',
        actionType: 'sample',
      },
      {
        id: 'zip_download',
        label: 'Batch ZIP Packaging',
        description: 'Export all processed files in a single .zip',
        icon: <Archive className="w-4 h-4" />,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        actionType: 'sample',
      },
    ],
  },
];

export const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = TOOLS_CATEGORIES.map((cat) => ({
    ...cat,
    tools: cat.tools.filter(
      (t) =>
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.tools.length > 0);

  return (
    <div className="bg-[#0B0F19] dark:bg-[#0B0F19] text-slate-200 border-b border-slate-800/80 p-6 sm:p-8 space-y-8 rounded-3xl shadow-2xl">
      
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-wide">
              ALL MEDIA TOOLS
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-gradient-to-r from-orange-500 to-rose-500 text-white">
              PRO STUDIO
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Select any processing tool to apply presets across your queue
          </p>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tools (e.g. MP4, WebP, Resize...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-[#131927] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Categories Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.title} className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase border-b border-slate-800/60 pb-2">
              {category.title}
            </h3>

            <div className="space-y-1.5">
              {category.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#131927]/60 hover:bg-[#1A2234] border border-slate-800/60 hover:border-slate-700 transition-all duration-200 group flex items-start gap-3"
                >
                  {/* Tool Icon Box */}
                  <div className={`p-2 rounded-lg border flex-shrink-0 transition-transform group-hover:scale-105 ${tool.iconBg}`}>
                    {tool.icon}
                  </div>

                  {/* Tool Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {tool.label}
                      </span>
                      {tool.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
