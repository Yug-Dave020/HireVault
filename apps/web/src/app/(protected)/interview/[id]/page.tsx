"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, ArrowLeft, Bot, User, CheckCircle2, Sparkles, Mic, MicOff, Code } from "lucide-react";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function InterviewChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = params;

  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState("java");
  const [codeValue, setCodeValue] = useState("");
  const [vocalMetrics, setVocalMetrics] = useState<any>(null);
  const [audioStart, setAudioStart] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioDurationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeThreshold = 10;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const checkVolumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ttsBufferRef = useRef("");
  const ttsMessageIdRef = useRef("");

  const STAGES = ["Intro", "Tech", "Behavioral", "Feedback"];

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError) {
        console.error(sessionError);
        return;
      }
      if (!mounted) return;
      
      setSession(sessionData);

      const { data: transcriptData, error: transcriptError } = await supabase
        .from("interview_transcripts")
        .select("*")
        .eq("session_id", id)
        .order("created_at", { ascending: true });

      if (!transcriptError && transcriptData && mounted) {
        setMessages(transcriptData);
      }
      
      if (!mounted) return;
      setIsLoading(false);
      
      initWebSocket(sessionData);
    };

    loadSession();

    return () => {
      mounted = false;
      if (wsRef.current) wsRef.current.close();
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (checkVolumeIntervalRef.current) clearInterval(checkVolumeIntervalRef.current);
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initWebSocket = (sessionData: any) => {
    const defaultBaseUrl = window.location.hostname === "localhost" ? "ws://localhost:8000" : "wss://api.hirevault.com";
    const baseUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL || defaultBaseUrl;
    const wsUrl = `${baseUrl}/ws/interview/${id}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chunk") {
          setIsSending(true);
        } else if (data.type === "text_delta") {
          setIsSending(false);
          
          if (!ttsMessageIdRef.current) {
             ttsMessageIdRef.current = Date.now().toString();
             setMessages(prev => [...prev, {
                id: ttsMessageIdRef.current,
                message_owner: "ai",
                content: "",
                stage: sessionData?.current_stage || "Intro"
             }]);
          }

          if (data.content) {
             setMessages(prev => prev.map(m => m.id === ttsMessageIdRef.current ? { ...m, content: m.content + data.content } : m));
             
             ttsBufferRef.current += data.content;
             const sentenceMatch = ttsBufferRef.current.match(/[^.!?]+[.!?]/g);
             if (sentenceMatch && sentenceMatch.length > 0) {
                const sentence = sentenceMatch[0];
                playTTS(sentence, false);
                ttsBufferRef.current = ttsBufferRef.current.substring(sentence.length);
             }
          }
        } else if (data.type === "final") {
          setIsSending(false);
          const fullMessage = data.ai_message;
          const stage = data.next_stage || sessionData?.current_stage;
          
          if (ttsBufferRef.current.trim() && !fullMessage.includes("[Interrupted]")) {
             playTTS(ttsBufferRef.current.trim(), false);
          }
          ttsBufferRef.current = "";
          
          setMessages(prev => {
             if (ttsMessageIdRef.current) {
                return prev.map(m => m.id === ttsMessageIdRef.current ? { 
                   ...m, 
                   content: fullMessage, 
                   stage: stage,
                   feedback_metadata: data.feedback_metadata || null
                } : m);
             }
             
             // Prevent duplicate bubbles if the last AI message was identical
             const lastMsg = prev[prev.length - 1];
             if (lastMsg && lastMsg.message_owner === "ai" && lastMsg.content === fullMessage) {
                return prev.map((m, i) => i === prev.length - 1 ? { 
                   ...m, 
                   stage: stage, 
                   feedback_metadata: data.feedback_metadata || null 
                } : m);
             }
             
             return [...prev, {
               id: Date.now().toString(),
               message_owner: "ai",
               content: fullMessage,
               stage: stage,
               feedback_metadata: data.feedback_metadata || null
             }];
          });
          
          ttsMessageIdRef.current = "";
          
          if (data.next_stage && data.next_stage !== sessionData?.current_stage) {
             setSession((s: any) => ({ ...s, current_stage: data.next_stage }));
             if (data.next_stage === "Feedback") router.refresh();
          }
        } else if (data.type === "error") {
          console.error("WS Error:", data.message);
          setIsSending(false);
        } else if (data.type === "transcription") {
           setMessages(prev => [...prev, {
             id: Date.now().toString(),
             message_owner: "user",
             content: data.text,
             stage: sessionData?.current_stage || "Intro"
           }]);
           
           if (audioDurationRef.current > 0) {
             const httpBaseUrl = baseUrl.replace("ws://", "http://").replace("wss://", "https://");
             fetch(`${httpBaseUrl}/interview/vocal-analysis`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                 transcript_text: data.text,
                 audio_duration_seconds: audioDurationRef.current || 1.0,
                 session_id: id,
                 turn_index: 0
               })
             })
             .then(res => res.json())
             .then(metrics => {
               setVocalMetrics(metrics);
               setMessages(prev => {
                 const newMsgs = [...prev];
                 const lastUserIdx = newMsgs.findLastIndex(m => m.message_owner === "user");
                 if (lastUserIdx !== -1) {
                   newMsgs[lastUserIdx] = {
                     ...newMsgs[lastUserIdx],
                     feedback_metadata: {
                       ...(newMsgs[lastUserIdx].feedback_metadata || {}),
                       vocal_metrics: metrics
                     }
                   };
                 }
                 return newMsgs;
               });
             })
             .catch(console.error);
             audioDurationRef.current = 0;
           }
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    wsRef.current = ws;
  };

  const playTTS = (text: string, cancelPrevious: boolean = true) => {
    if (cancelPrevious) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      setAudioStart(Date.now());
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        if (audioBlob.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(audioBlob);
        }
      };

      checkVolumeIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        if (avg > volumeThreshold) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "interrupt" }));
            }
          }
        }
      }, 200);

      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Failed to get mic", err);
    }
  };

  const stopRecording = () => {
    if (audioStart) audioDurationRef.current = (Date.now() - audioStart) / 1000;
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (checkVolumeIntervalRef.current) clearInterval(checkVolumeIntervalRef.current);
    setIsRecording(false);
  };

  const handleSendText = () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue("");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text_message", text }));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message_owner: "user",
        content: text,
        stage: session?.current_stage || "Intro"
      }]);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || "";
    setCodeValue(val);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "code_update", code: val }));
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  if (!session) {
    return <div className="p-8">Session not found.</div>;
  }

  const isFeedback = session.current_stage === "Feedback";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-50 overflow-hidden">
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/interview" onClick={() => router.refresh()} className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight">AI Mock Interview (Live)</h1>
            <p className="text-xs text-zinc-500 font-medium">Target: <span className="text-indigo-600">{session.target_position}</span> • Persona: <span className="capitalize">{session.selected_persona}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {STAGES.map((s, i) => {
            const isActive = session.current_stage === s;
            const isPast = STAGES.indexOf(session.current_stage) > i;
            return (
              <div key={s} className="flex items-center">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? "bg-indigo-600 text-white" : isPast ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-400"
                  }`}>
                  {s}
                </div>
                {i < STAGES.length - 1 && <div className={`w-4 h-0.5 mx-1 ${isPast ? "bg-indigo-200" : "bg-zinc-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: CODE SANDBOX */}
        <div className="w-1/2 border-r border-zinc-200 flex flex-col bg-zinc-900 overflow-hidden">
          <div className="h-12 bg-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase">
              <Code className="h-4 w-4" /> Code Sandbox
            </div>
            <select
              value={editorLanguage}
              onChange={e => setEditorLanguage(e.target.value)}
              className="bg-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 border-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="java">Java</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={editorLanguage}
              theme="vs-dark"
              value={codeValue}
              onChange={handleEditorChange}
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: CHAT & VOICE CONSOLE */}
        <div className="w-1/2 flex flex-col bg-zinc-50 relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="w-full max-w-2xl mx-auto space-y-6 pb-20">
              {messages.map((msg, idx) => {
                const isUser = msg.message_owner === "user";
                return (
                  <div key={msg.id || idx} className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isUser ? "bg-indigo-100 text-indigo-600" : "bg-zinc-900 text-white"}`}>
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
                      <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-zinc-200/80 text-zinc-800 rounded-tl-sm whitespace-pre-wrap"
                        }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 mt-1.5 px-1">{msg.stage} Phase</span>
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-zinc-200/80 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}

              {isFeedback && messages.length > 0 && (
                <div className="mt-12 mb-8 space-y-6">
                  {messages.some(m => m.message_owner === "ai" && m.feedback_metadata?.vocal_metrics) && (
                    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                      <h3 className="font-bold text-lg mb-4">Vocal Fingerprint</h3>
                      <div className="w-full max-w-md aspect-square">
                        <Radar 
                          data={{
                            labels: ["Pace (WPM)", "Clarity", "Confidence", "Fluency", "Conciseness"],
                            datasets: [{
                              label: "Your Average Metrics",
                              data: (() => {
                                const aiMessages = messages.filter(m => m.message_owner === "ai" && m.feedback_metadata?.vocal_metrics);
                                let wpm = 0, filler = 0, silence = 0, conf = 0;
                                aiMessages.forEach(m => {
                                  const v = m.feedback_metadata.vocal_metrics;
                                  wpm += v.wpm; filler += v.filler_rate; silence += v.silence_ratio; conf += v.confidence_score;
                                });
                                const n = aiMessages.length;
                                return [
                                  Math.min(100, (wpm / n) / 1.5), 
                                  Math.max(0, 100 - (filler / n) * 5), 
                                  conf / n, 
                                  Math.max(0, 100 - (silence / n) * 2), 
                                  100 - (filler / n) * 2
                                ];
                              })(),
                              backgroundColor: "rgba(26, 145, 240, 0.2)",
                              borderColor: "#1a91f0",
                              pointBackgroundColor: "#1a91f0",
                              borderWidth: 2,
                            }]
                          }}
                          options={{ scales: { r: { min: 0, max: 100 } } }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-emerald-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <h3 className="text-emerald-900 font-bold tracking-tight text-lg">Diagnostic Report</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {messages.filter((m: any) => m.message_owner === "ai" && m.feedback_metadata && m.feedback_metadata.score).map((msg: any, i: number) => {
                          const metadata = msg.feedback_metadata;
                          const fullIdx = messages.findIndex((m: any) => m.id === msg.id);
                          
                          const precedingMessages = messages.slice(0, fullIdx).reverse();
                          const userAnswerMsg = precedingMessages.find((m: any) => m.message_owner === "user");
                          const aiQuestionMsg = precedingMessages.find((m: any) => m.message_owner === "ai");
                          
                          const userAnswer = userAnswerMsg?.content || "No answer recorded.";
                          const aiQuestion = aiQuestionMsg?.content || "No question recorded.";
                          const questionStage = aiQuestionMsg?.stage || msg.stage;

                          return (
                            <div key={i} className="flex flex-col gap-4 p-5 rounded-xl bg-zinc-50/50 border border-zinc-200 shadow-sm">

                              <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-zinc-200 min-w-[100px] shrink-0">
                                  <span className="text-3xl font-black tracking-tighter text-indigo-600">{metadata.score}</span>
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Score</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-2">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Analysis ({questionStage})</div>
                                  <p className="text-sm text-zinc-700 leading-relaxed font-medium">{metadata.rationale}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">The Question</div>
                                  <div className="text-xs text-zinc-600 bg-white p-3 rounded-lg border border-zinc-100">{aiQuestion}</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Your Answer</div>
                                  <div className="text-xs text-zinc-600 bg-white p-3 rounded-lg border border-zinc-100">{userAnswer}</div>
                                </div>
                              </div>

                              {metadata.ideal_answer && (
                                <div className="mt-2 space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Ideal Answer Focus
                                  </div>
                                  <div className="text-sm text-indigo-900 leading-relaxed">{metadata.ideal_answer}</div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {!isFeedback && (
            <div className="absolute bottom-0 w-full bg-white border-t border-zinc-200 p-4 flex-shrink-0 flex flex-col">
              {vocalMetrics && (
                <div className="w-full max-w-2xl mx-auto mb-3 flex items-center justify-between bg-zinc-50 border border-zinc-200 p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase">WPM:</span>
                    <span className={`text-sm font-black ${vocalMetrics.wpm >= 110 && vocalMetrics.wpm <= 150 ? 'text-green-600' : 'text-amber-500'}`}>{vocalMetrics.wpm}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Filler:</span>
                    <span className="text-sm font-black text-red-500">{vocalMetrics.filler_rate}%</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 max-w-[150px] ml-4">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Confidence</span>
                    <div className="h-2 flex-1 bg-zinc-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${vocalMetrics.confidence_score > 70 ? 'bg-green-500' : vocalMetrics.confidence_score > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${vocalMetrics.confidence_score}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full max-w-2xl mx-auto flex gap-3 items-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center transition-colors shadow-sm ${isRecording ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-zinc-900 hover:bg-zinc-800 text-white"
                    }`}
                  title={isRecording ? "Stop Recording" : "Start Voice Session"}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    placeholder="Type an emergency fallback message..."
                    className="w-full resize-none bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
                  />
                  <button
                    onClick={handleSendText}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 bottom-2 h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
