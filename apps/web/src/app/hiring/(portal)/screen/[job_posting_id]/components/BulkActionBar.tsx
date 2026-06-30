"use client";

import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";

export default function BulkActionBar({ selectedCount, onClear, onCompose }: { selectedCount: number, onClear: () => void, onCompose?: () => void }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-full px-4 py-3 shadow-2xl flex items-center gap-6 z-30 transform transition-all animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-2 font-medium pl-2">
        <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-sm">{selectedCount}</span>
        <span>candidates selected</span>
      </div>
      
      <div className="flex items-center gap-2 border-l border-white/20 pl-6">
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white h-8 rounded-full px-4" onClick={onCompose}>
          <Mail className="w-3.5 h-3.5 mr-2" />
          Compose Bulk Email
        </Button>
        <button onClick={onClear} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ml-1">
          <X className="w-4 h-4 text-zinc-300 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
