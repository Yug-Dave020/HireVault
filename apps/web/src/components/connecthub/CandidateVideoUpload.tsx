"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, Video as VideoIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CandidateVideoUploadProps {
  onUploadSuccess?: () => void;
}

export function CandidateVideoUpload({ onUploadSuccess }: CandidateVideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);
      if (onUploadSuccess) onUploadSuccess();
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-emerald-900">Video Uploaded!</h4>
        <p className="text-sm text-emerald-700">
          Your async interview has been submitted successfully. The hiring manager will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <VideoIcon className="w-4 h-4 text-indigo-600" />
        <h4 className="font-semibold text-zinc-900 text-sm">Requested Video Screen</h4>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          The hiring manager has requested a short async video screening. Please record a 5-10 minute video introducing yourself and explaining your recent projects.
        </p>

        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
          <UploadCloud className="w-10 h-10 text-zinc-400 mb-4" />
          <p className="text-sm font-medium text-zinc-900 mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-zinc-500 mb-6">MP4, WebM or MOV (max. 100MB)</p>
          
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Select Video"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
