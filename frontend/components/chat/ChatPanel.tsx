"use client";

import { useEditor } from "@/context/EditorContext";
import api from "@/lib/axios";
import { getLanguage } from "@/utils/getLanguage";
import { useRef, useEffect, useState } from "react";
import {
  Send,
  Bot,
  User,
  Code2,
  Mic,
  Loader2,
  Phone,
  MessageSquare,
  PhoneOff,
  Trash2,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Typewriter hook for streaming effect
function useTypewriter(text: string, isActive: boolean, speed: number = 12) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    setDisplayed("");
    setIsDone(false);
    let i = 0;

    const interval = setInterval(() => {
      i += 3; // 3 chars per tick for natural speed
      if (i >= text.length) {
        setDisplayed(text);
        setIsDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  return { displayed, isDone };
}

// Individual message component with typewriter support
function AssistantMessage({ content, shouldStream }: { content: string; shouldStream: boolean }) {
  const { displayed, isDone } = useTypewriter(content, shouldStream);

  return (
    <span>
      {displayed}
      {shouldStream && !isDone && <span className="animate-blink text-[#58a6ff] ml-0.5">▌</span>}
    </span>
  );
}

export default function ChatPanel({
  repoId,
  chatMessages,
  callMessages,
  input,
  setInput,
  sendMessage,
  addCallMessages,
  loading,
  streamingIndex,
  onStreamComplete,
  onDeleteChat,
}: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chat" | "call">("chat");
  const [callState, setCallState] = useState<"idle" | "listening" | "processing" | "speaking">(
    "idle"
  );
  const callStateRef = useRef<string>("idle");

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Silence detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const SILENCE_THRESHOLD = 15; // Volume level below which counts as silence (0-255)
  const SILENCE_DURATION = 1500; // ms of continuous silence before auto-send
  const hasSpokenRef = useRef(false); // Track if user has spoken at all

  const { setEditorState } = useEditor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeMessages = activeTab === "chat" ? chatMessages : callMessages;

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, callMessages, loading, activeTab]);

  // Auto-scroll during typewriter streaming
  useEffect(() => {
    if (streamingIndex !== null) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [streamingIndex]);

  const openReference = async (ref: any) => {
    try {
      const res = await api.get("/files/content", {
        params: { repoId, path: ref.file },
      });

      setEditorState({
        filePath: ref.file,
        content: res.data.content,
        language: getLanguage(ref.file),
        startLine: ref.startLine,
        endLine: ref.endLine,
      });
    } catch (err) {
      console.error("Open reference error:", err);
    }
  };

  const handleBlastRadiusClick = (file: string, name: string) => {
    const nodeId = name ? `${file}::${name}` : file;
    router.push(`/graph/${repoId}?blastRadius=${encodeURIComponent(nodeId)}`);
  };

  const stopSilenceDetection = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    silenceStartRef.current = null;
    hasSpokenRef.current = false;
    setAudioLevel(0);
  };

  const startSilenceDetection = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      silenceStartRef.current = null;
      hasSpokenRef.current = false;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        if (callStateRef.current !== "listening" || !analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        setAudioLevel(avg);

        if (avg > SILENCE_THRESHOLD) {
          // User is speaking
          hasSpokenRef.current = true;
          silenceStartRef.current = null;
        } else if (hasSpokenRef.current) {
          // Silence detected AFTER user has spoken
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION) {
            // Enough silence — auto-send
            console.log("Silence detected — auto-sending audio");
            triggerSendAudio();
            return; // Stop the loop
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      animFrameRef.current = requestAnimationFrame(checkAudio);
    } catch (err) {
      console.error("Silence detection setup failed:", err);
    }
  };

  const cleanupCall = () => {
    console.log("Call Status: CALL ENDED (Cleaned Up)");
    callStateRef.current = "idle"; // Sync update BEFORE stopping recorder
    stopSilenceDetection();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCallState("idle");
    toast("Call ended");
  };

  const triggerSendAudio = () => {
    if (callStateRef.current === "listening") {
      stopSilenceDetection();
      callStateRef.current = "processing"; // Sync update BEFORE stopping recorder
      setCallState("processing");
      toast("Transcribing audio...");
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const startListeningPhase = async () => {
    console.log("Call Status: LISTENING");
    try {
      if (callStateRef.current !== "idle" && callStateRef.current !== "speaking") return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (callStateRef.current === "idle") return;
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        if (callStateRef.current === "processing") {
          await processAudioMessage(audioBlob);
        }
      };

      mediaRecorder.start();
      setCallState("listening");

      // Start silence detection on the mic stream
      startSilenceDetection(stream);
    } catch (err) {
      console.error("Microphone error:", err);
      toast.error("Microphone access denied or unavailable.");
      cleanupCall();
    }
  };

  const processAudioMessage = async (audioBlob: Blob) => {
    console.log("Call Status: PROCESSING AUDIO");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];
        if (!base64data || callStateRef.current === "idle") return;

        const res = await api.post("/call/process", {
          repoId,
          audioBase64: base64data,
        });

        if (callStateRef.current === "idle") return;

        if (res.data.success) {
          console.log("Call Status: RECEIVED AI ANSWER AND CHUNKS");

          const { userText, answer, references, chunks } = res.data;

          if (addCallMessages && userText) {
            addCallMessages([
              { role: "user", content: userText },
              { role: "assistant", content: answer, references: references },
            ]);
            toast.success("LLM responded");
            setTimeout(scrollToBottom, 500);
          }

          if (chunks && chunks.length > 0) {
            console.log("Call Status: SPEAKING (TTS PLAYBACK) - CHUNKED QUEUE STARTING");
            setCallState("speaking");
            toast("Agent speaking...");
            await playTTSQueue(chunks, 0);
          } else {
            if (callStateRef.current !== "idle") startListeningPhase();
          }
        } else {
          console.error("Error from backend data payload");
          startListeningPhase();
        }
      };
    } catch (err) {
      console.error("Audio processing error:", err);
      startListeningPhase();
    }
  };

  const playTTSQueue = async (audioChunks: string[], index: number = 0) => {
    if (callStateRef.current === "idle") return;

    if (index >= audioChunks.length) {
      console.log("Call Status: FINISHED ALL CHUNKS, RESTARTING LISTENING");
      startListeningPhase();
      return;
    }

    try {
      console.log(`Call Status: FETCHING TTS FOR CHUNK ${index + 1}/${audioChunks.length}`);
      const res = await api.get("/call/tts", {
        params: { text: audioChunks[index] },
        responseType: "blob",
      });

      if (callStateRef.current === "idle") return;

      const audioUrl = window.URL.createObjectURL(new Blob([res.data], { type: "audio/mpeg" }));

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          playTTSQueue(audioChunks, index + 1);
        };
        await audioRef.current.play();
      } else {
        startListeningPhase();
      }
    } catch (err) {
      console.error("TTS chunk playback failed. Skipping to next...", err);
      playTTSQueue(audioChunks, index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteChat = () => {
    const type = activeTab;
    const confirmMsg =
      type === "chat"
        ? "Are you sure you want to delete all chat history? This cannot be undone."
        : "Are you sure you want to delete all call history? This cannot be undone.";

    if (confirm(confirmMsg)) {
      onDeleteChat(type);
      toast.success(`${type === "chat" ? "Chat" : "Call"} history deleted`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] relative">
      <div className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-10 flex flex-col shadow-sm">
        <div className="p-4 flex flex-row items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#c9d1d9] flex items-center gap-2">
            <Bot size={16} className="text-[#58a6ff]" />
            RepoLens AI
          </h3>
          <div className="flex items-center gap-2">
            {callState === "listening" && (
              <div className="text-xs text-[#ff5858] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Mic size={12} /> Recording
              </div>
            )}
            {callState === "processing" && (
              <div className="text-xs text-[#58a6ff] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Thinking
              </div>
            )}
            {callState === "speaking" && (
              <div className="text-xs text-[#a371f7] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Bot size={12} /> Speaking
              </div>
            )}

            {/* Delete Chat Button */}
            {activeMessages.length > 0 && (
              <button
                onClick={handleDeleteChat}
                className="cursor-pointer p-1.5 rounded-lg text-[#8b949e] hover:text-[#f85149] hover:bg-[#f85149]/10 active:scale-90 transition-all duration-200"
                title={`Clear ${activeTab} history`}
              >
                <Trash2 size={14} />
              </button>
            )}

            <div
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${
                callState === "listening"
                  ? "text-[#ff5858] bg-[#ff5858]"
                  : callState === "processing"
                    ? "text-[#58a6ff] bg-[#58a6ff]"
                    : callState === "speaking"
                      ? "text-[#a371f7] bg-[#a371f7]"
                      : "text-[#2ea043] bg-[#2ea043]"
              }`}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#30363d]/50">
          <button
            onClick={() => setActiveTab("chat")}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "chat" ? "text-[#58a6ff] border-b-2 border-[#58a6ff] bg-[#0d1117]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"}`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("call")}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "call" ? "text-[#2ea043] border-b-2 border-[#2ea043] bg-[#0d1117]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]"}`}
          >
            <Phone size={14} />
            Call
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-4 space-y-6 bg-[#0d1117] custom-scrollbar scroll-smooth relative z-0`}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-l from-[#58a6ff]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>

        {activeMessages.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-6 shadow-inner">
              <Bot className="h-8 w-8 text-[#58a6ff]" />
            </div>
            <p className="text-base font-medium text-[#c9d1d9] mb-2">
              {activeTab === "chat"
                ? "How can I help with this codebase?"
                : "Speak your mind with RepoLens"}
            </p>
            <p className="text-sm text-[#8b949e]">
              {activeTab === "chat"
                ? "Ask for architecture details, exact files, or component logic."
                : "I'm listening and ready to dive into the code with you."}
            </p>
          </div>
        ) : (
          activeMessages.map((msg: any, i: number) => {
            const isStreamingThis =
              activeTab === "chat" && msg.role === "assistant" && i === streamingIndex;

            return (
              <div
                key={i}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-fadeInUp group`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[85%] rounded-2xl overflow-hidden transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-[#21262d] to-[#161b22] border border-[#30363d]/50 rounded-tr-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] group-hover:shadow-[0_4px_25px_rgba(255,255,255,0.05)]"
                      : "glass-panel border border-[rgba(255,255,255,0.05)] border-l-2 border-l-[#58a6ff]/50 rounded-tl-sm shadow-[0_4px_25px_rgba(0,0,0,0.3)] group-hover:shadow-[0_8px_30px_rgba(88,166,255,0.1)]"
                  }`}
                >
                  <div
                    className={`px-4 py-2 text-[11px] font-bold tracking-wide uppercase flex items-center gap-2 transition-all duration-300 ${
                      msg.role === "user"
                        ? "text-[#c9d1d9] justify-end"
                        : "text-[#58a6ff] border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]"
                    }`}
                  >
                    {msg.role === "assistant" && <Bot size={14} className="text-[#58a6ff]" />}
                    {msg.role === "user" ? "You" : "RepoLens"}
                    {msg.role === "user" && <User size={14} className="text-[#8b949e]" />}
                  </div>
                  <div className="p-4 text-[13px] sm:text-sm text-[#c9d1d9] whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.role === "assistant"
                      ? (() => {
                          let cleanContent = msg.content;
                          let blastRadiusInfo = null;
                          const blastRegex =
                            /<blast_radius\s+file="([^"]+)"\s+name="([^"]*)"\s*\/>/;
                          const match = cleanContent.match(blastRegex);

                          if (match) {
                            cleanContent = cleanContent.replace(blastRegex, "").trim();
                            blastRadiusInfo = { file: match[1], name: match[2] };
                          }

                          return (
                            <div className="flex flex-col gap-3">
                              <AssistantMessage
                                content={cleanContent}
                                shouldStream={isStreamingThis}
                              />
                              {blastRadiusInfo && (
                                <button
                                  onClick={() =>
                                    handleBlastRadiusClick(
                                      blastRadiusInfo.file,
                                      blastRadiusInfo.name
                                    )
                                  }
                                  className="cursor-pointer mt-2 self-start py-2 px-4 flex items-center justify-center gap-2 bg-[#ff5858]/10 hover:bg-[#ff5858]/20 text-[#ff5858] border border-[#ff5858]/30 hover:border-[#ff5858] rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                  <Flame size={16} /> Visualize Blast Radius in Graph
                                </button>
                              )}
                            </div>
                          );
                        })()
                      : msg.content}
                  </div>
                </div>

                {msg.references && msg.references.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full max-w-[85%] self-start ml-2">
                    <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider block mb-1">
                      References
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.references.map((ref: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => openReference(ref)}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff] hover:bg-[#58a6ff]/10 rounded-lg px-2.5 py-1.5 text-[#c9d1d9] transition-all shadow-sm group"
                          title="Click to view in editor"
                        >
                          <Code2 className="w-3.5 h-3.5 text-[#58a6ff] group-hover:scale-110 transition-transform" />
                          <span className="font-mono">{ref.file.split("/").pop()}</span>
                          <span className="text-[#8b949e] font-mono">L{ref.startLine}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-start animate-fadeInUp">
            <div className="max-w-[85%] glass-panel border border-[rgba(255,255,255,0.05)] border-l-2 border-l-[#58a6ff]/50 rounded-2xl rounded-tl-sm overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
              <div className="px-4 py-2 text-[11px] font-bold tracking-wide uppercase border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] text-[#58a6ff] flex items-center gap-2">
                <Bot size={14} className="text-[#58a6ff]" />
                RepoLens
              </div>
              <div className="p-5 text-[13px] text-[#8b949e] flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"></div>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {activeTab === "chat" ? (
        <div className="px-4 py-4 bg-gradient-to-t from-[#0d1117] via-[#0d1117] to-[#0d1117]/10 relative z-10 w-full pt-10 mt-auto">
          <div className="glass-panel border border-[#30363d]/80 rounded-2xl focus-within:border-[#58a6ff]/50 focus-within:shadow-[0_0_15px_rgba(88,166,255,0.1)] transition-all duration-300 flex items-end relative shadow-inner p-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this repo..."
              className="flex-1 bg-transparent px-4 py-3 text-[13px] text-[#c9d1d9] focus:outline-none resize-none min-h-[44px] max-h-[150px] overflow-y-auto placeholder:text-[#8b949e] custom-scrollbar"
              disabled={loading}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="mb-1 mr-1 p-2.5 rounded-xl bg-[#2ea043] hover:bg-[#3fb950] active:scale-95 text-white disabled:opacity-50 disabled:bg-[#30363d]/50 disabled:text-[#8b949e] transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-sm border border-[rgba(255,255,255,0.1)] disabled:border-transparent shrink-0"
            >
              <Send size={16} className={loading || !input.trim() ? "" : "translate-x-[-1px]"} />
            </button>
          </div>
          <div className="w-full mt-3 flex justify-center">
            <span className="text-[10px] text-[#8b949e] font-medium tracking-wide opacity-80 flex items-center gap-1.5">
              RepoLens Assistant <span className="w-1 h-1 rounded-full bg-[#484f58]"></span> AI can
              make mistakes
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 bg-[#0d1117] border-t border-[#30363d] relative z-10 flex flex-col items-center justify-center min-h-[160px]">
          <audio ref={audioRef} className="hidden" />

          {callState === "idle" ? (
            <>
              <button
                onClick={startListeningPhase}
                className="cursor-pointer w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-[#2ea043] border border-[#2ea043] text-white hover:bg-[#238636] hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(46,160,67,0.3)]"
              >
                <Phone size={32} />
              </button>
              <span className="text-xs mt-4 tracking-wide font-medium text-[#8b949e]">
                Tap to Start Call
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Audio level visualizer during listening */}
              {callState === "listening" && (
                <div className="flex items-end justify-center gap-[3px] h-10 mb-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const barScale = [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5][i];
                    const normalizedLevel = Math.min(audioLevel / 60, 1);
                    const barHeight = Math.max(4, normalizedLevel * 32 * barScale);
                    return (
                      <div
                        key={i}
                        className="w-[4px] rounded-full bg-[#ff5858] transition-all duration-100"
                        style={{ height: `${barHeight}px`, opacity: 0.5 + normalizedLevel * 0.5 }}
                      />
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="relative">
                  {callState === "listening" && (
                    <div
                      className={`w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#ff5858] flex items-center justify-center shadow-[0_0_20px_rgba(255,88,88,0.3)] ${audioLevel > SILENCE_THRESHOLD ? "scale-105" : "scale-100"} transition-transform duration-150`}
                    >
                      <Mic className="w-8 h-8 text-[#ff5858]" />
                    </div>
                  )}
                  {callState === "processing" && (
                    <div className="w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#58a6ff] flex items-center justify-center shadow-[0_0_15px_rgba(88,166,255,0.3)]">
                      <Loader2 className="w-8 h-8 text-[#58a6ff] animate-spin" />
                    </div>
                  )}
                  {callState === "speaking" && (
                    <div className="w-16 h-16 rounded-full bg-[#161b22] border-2 border-[#a371f7] flex items-center justify-center shadow-[0_0_15px_rgba(163,113,247,0.3)] animate-pulse">
                      <Bot className="w-8 h-8 text-[#a371f7]" />
                    </div>
                  )}
                </div>

                <button
                  onClick={cleanupCall}
                  className="cursor-pointer w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-[#ff5858] text-white shadow-[0_4px_15px_rgba(255,88,88,0.4)] hover:bg-[#d73a49] hover:scale-105 active:scale-95"
                  title="End Call"
                >
                  <PhoneOff size={24} />
                </button>
              </div>

              <span
                className={`text-sm tracking-wide font-medium ${
                  callState === "listening"
                    ? "text-[#ff5858]"
                    : callState === "processing"
                      ? "text-[#58a6ff]"
                      : "text-[#a371f7]"
                }`}
              >
                {callState === "listening" && "Listening... speak now"}
                {callState === "processing" && "Processing..."}
                {callState === "speaking" && "Agent Speaking..."}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
