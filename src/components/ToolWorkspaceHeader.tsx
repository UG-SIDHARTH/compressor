import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ToolWorkspaceHeaderProps {
  tool: {
    label: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
  };
  onBackToHub: () => void;
}

export const ToolWorkspaceHeader: React.FC<ToolWorkspaceHeaderProps> = ({
  tool,
  onBackToHub,
}) => {
  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
      
      {/* Top Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#141A29] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 transition-all group shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Media Tools</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Dedicated Tool Mode
        </span>
      </div>

      {/* Main Tool Title & Icon Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <div className={`p-4 rounded-2xl border text-xl flex-shrink-0 shadow-md ${tool.iconBg}`}>
          {tool.icon}
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {tool.label}
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
              ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {tool.description}
          </p>
        </div>
      </div>

    </div>
  );
};
