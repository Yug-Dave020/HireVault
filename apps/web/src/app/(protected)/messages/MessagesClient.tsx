"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/connecthub/ChatInterface";
import { Search, Building2, Briefcase, MapPin, Clock, UploadCloud, CheckCircle2, Video as VideoIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";

import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function MessagesClient({ 
  conversations, 
  videoScreens,
  currentUserId
}: { 
  conversations: any[], 
  videoScreens: any[],
  currentUserId: string
}) {
  const [activeChatId, setActiveChatId] = useState<string | null>(conversations.length > 0 ? conversations[0].id : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const supabase = createClient();

  const activeChat = conversations.find(c => c.id === activeChatId);
  const associatedVideoScreen = activeChat 
    ? videoScreens.find(vs => vs.cv_submission_id === activeChat.cv_submission_id)
    : null;

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !associatedVideoScreen) return;
    const file = e.target.files[0];
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('async_videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update the async_video_screens record
      const { error: updateError } = await supabase
        .from('async_video_screens')
        .update({ 
          video_storage_path: filePath,
          status: 'uploaded'
        })
        .eq('id', associatedVideoScreen.id);

      if (updateError) throw updateError;
      
      toast.success("Video uploaded successfully!");
      // Reload page to reflect changes
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const company = (c.job_postings?.company_name || "").toLowerCase();
    const title = (c.job_postings?.title || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return company.includes(q) || title.includes(q);
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] bg-[#f4f5f6]">
      {/* Left Sidebar: Chat List */}
      <div className={`w-full md:w-80 bg-white border-r border-zinc-200 flex-col h-full shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-100 space-y-4">
          <h2 className="font-bold text-xl text-zinc-900 tracking-tight">Employer Chats</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search companies..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-50 border-zinc-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500 text-center">
              No active conversations found.
            </div>
          ) : (
            filteredConversations.map(chat => {
              const isActive = activeChatId === chat.id;
              const companyName = chat.job_postings?.company_name || "Company";
              const title = chat.job_postings?.title || "Role";
              
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-indigo-50 border border-indigo-100" 
                      : "hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold text-sm text-zinc-900 truncate pr-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                      {companyName}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                      {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-indigo-600 font-medium mb-1 truncate">
                    {title}
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-1 leading-relaxed">
                    Tap to view your conversation...
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex min-w-0 h-full ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Pane */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-200 relative">
              <button 
                className="md:hidden absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow border border-zinc-200 text-sm font-bold"
                onClick={() => window.location.href = '/messages'}
              >
                ← Back
              </button>
              <ChatInterface 
                conversationId={activeChat.id}
                currentUserId={currentUserId}
                candidateName={activeChat.job_postings?.company_name || "Company"}
                isCandidateView={true}
              />
            </div>

            {/* Right Context Panel */}
            <div className="w-[340px] bg-white flex flex-col h-full shrink-0 overflow-y-auto">
              <div className="p-6 border-b border-zinc-100">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4 border border-zinc-200 shadow-sm">
                  <Building2 className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-1">{activeChat.job_postings?.company_name || "Company"}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-4">{activeChat.job_postings?.title || "Role"}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    {activeChat.job_postings?.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Briefcase className="w-4 h-4 text-zinc-400" />
                    {activeChat.job_postings?.employment_type || "Full-time"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    Connected {formatDistanceToNow(new Date(activeChat.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Action Required: Video Upload */}
                {associatedVideoScreen && !associatedVideoScreen.video_storage_path && (
                  <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <VideoIcon className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-semibold text-zinc-900 text-sm">Requested Video Screen</h4>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                        The hiring manager has requested a short async video screening. Please upload a 5-10 minute video introducing yourself.
                      </p>
                      <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                        <UploadCloud className="w-10 h-10 text-zinc-400 mb-4" />
                        <p className="text-sm font-medium text-zinc-900 mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-zinc-500 mb-6">MP4, WebM or MOV</p>
                        
                        <input 
                          type="file" 
                          accept="video/*" 
                          id={`video-upload-${associatedVideoScreen.id}`}
                          className="hidden"
                          onChange={handleVideoUpload}
                          disabled={uploading}
                        />
                        <label htmlFor={`video-upload-${associatedVideoScreen.id}`}>
                          <div className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] cursor-pointer h-8 px-2.5 text-sm font-medium transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                            ) : (
                              "Select Video"
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {associatedVideoScreen && associatedVideoScreen.video_storage_path && (
                  <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-emerald-900">Video Uploaded!</h4>
                    <p className="text-sm text-emerald-700">
                      Your async interview has been submitted successfully. The hiring manager will review it shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-white">
            <Building2 className="w-12 h-12 mb-4 text-zinc-300" />
            <p>Select a company to view your messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
