"use client";

import { useState, useRef, useEffect } from "react";
import { Video, Mic, StopCircle, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AsyncInterviewCandidatePage() {
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const supabase = createClient();

  // Initialize camera preview
  const initializeCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
    } catch (err) {
      console.error("Failed to access camera", err);
      alert("Could not access camera or microphone.");
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      // Cleanup streams on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setRecorded(true);
      if (playbackRef.current) {
        playbackRef.current.src = URL.createObjectURL(blob);
      }
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const retake = () => {
    setVideoBlob(null);
    setRecorded(false);
    chunksRef.current = [];
  };

  const submitVideo = async () => {
    if (!videoBlob) return;
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';
      const fileName = `${userId}-${Date.now()}.webm`;

      const { data, error } = await supabase.storage
        .from('async_videos')
        .upload(fileName, videoBlob, {
          contentType: 'video/webm'
        });

      if (error) throw error;

      // After upload, we would notify our backend to start processing
      // For this demo, we'll just mock the backend call
      await fetch('/api/connecthub/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_path: data.path,
          cv_submission_id: 'demo-submission-id' 
        })
      });

      alert("Video submitted successfully!");
      // router.push("/candidate-dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to upload video.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Async Video Screening</h1>
        <p className="text-zinc-500 mb-8">
          Please record a short 2-3 minute video answering the prompt below.
        </p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-indigo-900 mb-2">Prompt 1 of 1:</h3>
          <p className="text-indigo-800">
            &quot;Describe a time you had to scale a distributed system under pressure. What were the core bottlenecks, and how did you resolve them?&quot;
          </p>
        </div>

        {/* Video Container */}
        <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden relative flex items-center justify-center mb-6">
          {!recorded ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`} 
              />
              {!stream && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto flex items-center justify-center">
                    <Video className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-400 font-medium">Requesting Camera...</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 text-red-500 font-bold px-3 py-1.5 rounded-full border border-red-500/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Recording
                </div>
              )}
            </>
          ) : (
            <video 
              ref={playbackRef} 
              controls 
              playsInline 
              className="w-full h-full object-cover" 
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {!recording && !recorded && (
            <Button 
              onClick={startRecording}
              disabled={!stream}
              className="bg-red-600 hover:bg-red-700 text-white w-48"
            >
              <Mic className="w-4 h-4 mr-2" /> Start Recording
            </Button>
          )}
          {recording && (
            <Button 
              onClick={stopRecording}
              className="bg-zinc-800 hover:bg-zinc-700 text-white w-48"
            >
              <StopCircle className="w-4 h-4 mr-2" /> Stop Recording
            </Button>
          )}
          {recorded && (
            <>
              <Button variant="outline" onClick={retake} disabled={uploading}>
                Retake
              </Button>
              <Button 
                onClick={submitVideo} 
                disabled={uploading}
                className="bg-[#1da074] hover:bg-[#15805c] text-white min-w-[160px]"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><UploadCloud className="w-4 h-4 mr-2" /> Submit Video</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
