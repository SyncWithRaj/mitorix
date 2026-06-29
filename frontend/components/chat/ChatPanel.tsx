"use client";

import { EditorContext } from "@/context/EditorContext";
import { CodeflowContext } from "@/context/CodeflowContext";
import { useContext } from "react";
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
  X,
  GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDragStore } from "@/lib/dragStore";
import { useSubscription } from "@/context/SubscriptionContext";
import { entityIcons } from "@/lib/dragdrop.types";
import type { DraggedContextNode } from "@/lib/dragdrop.types";

// Typewriter hook for streaming effect
function useTypewriter(text: string, isActive: boolean, speed: number = 12) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let i = 0;

    const interval = setInterval(() => {
      i += 3;
      if (i >= text.length) {
        setStep(text.length);
        clearInterval(interval);
      } else {
        setStep(i);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isActive, speed]);

  if (!isActive) {
    return { displayed: text, isDone: true };
  }

  const displayed = text.slice(0, step);
  return { displayed, isDone: step >= text.length };
}

// Individual message component with typewriter support
function AssistantMessage({ content, shouldStream }: { content: string; shouldStream: boolean }) {
  const { displayed, isDone } = useTypewriter(content, shouldStream);

  return (
    <span>
      {displayed}
      {shouldStream && !isDone && <span className="animate-blink text-[#ff6b00] ml-0.5">▌</span>}
    </span>
  );
}

type ChatRef = { file: string; startLine?: number; endLine?: number };
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  references?: ChatRef[];
  attachedNodes?: DraggedContextNode[];
  attachments?: DraggedContextNode[];
};

type ChatPanelProps = {
  repoId: string;
  chatMessages: ChatMessage[];
  callMessages: ChatMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  addCallMessages: (messages: ChatMessage[]) => void;
  loading: boolean;
  streamingIndex: number | null;
  onDeleteChat: (type: "chat" | "call") => void;
  attachedNodes?: DraggedContextNode[];
  setAttachedNodes?: React.Dispatch<React.SetStateAction<DraggedContextNode[]>>;
};

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
  onDeleteChat,
  attachedNodes = [],
  setAttachedNodes,
}: ChatPanelProps) {
  const router = useRouter();
  const { isDragging } = useDragStore();
  const { hasFeature } = useSubscription();
  const [dropHighlight, setDropHighlight] = useState(false);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);
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

  const editorContext = useContext(EditorContext);
  const setEditorState = editorContext?.setEditorState || null;
  const codeflowContext = useContext(CodeflowContext);
  const setFilePreview = codeflowContext?.setFilePreview || null;
  const setCodeflowSelectedFile = codeflowContext?.setSelectedFile || null;
  const setCodeflowRightTab = codeflowContext?.setRightTab || null;
  const setCodeflowHighlightRange = codeflowContext?.setCodeHighlightRange || null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "call">("chat");

  // ── Handle drops from HTML5 drag (DOM elements like file tree, panels) ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    const raw = e.dataTransfer.getData("application/mitorix-node");
    if (raw) {
      try {
        const node: DraggedContextNode = JSON.parse(raw);
        if (setAttachedNodes) {
          setAttachedNodes((prev: DraggedContextNode[]) =>
            prev.some((n) => n.id === node.id) ? prev : [...prev, node]
          );
        }
      } catch {}
    }
    useDragStore.getState().stopDrag();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropHighlight(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only deactivate if truly leaving the drop zone (not entering a child)
    if (chatInputAreaRef.current && !chatInputAreaRef.current.contains(e.relatedTarget as Node)) {
      setDropHighlight(false);
    }
  };

  // ── Handle drops from canvas-based drags (ForceGraph) via Zustand mouseup ──
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      const { isDragging: dragging, draggedItem } = useDragStore.getState();
      if (dragging && draggedItem && chatInputAreaRef.current) {
        const rect = chatInputAreaRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          if (setAttachedNodes) {
            setAttachedNodes((prev: DraggedContextNode[]) =>
              prev.some((n) => n.id === draggedItem.id) ? prev : [...prev, draggedItem]
            );
          }
        }
        setDropHighlight(false);
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp, true);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp, true);
  }, [setAttachedNodes]);

  const userScrolledUpRef = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
    userScrolledUpRef.current = !isNearBottom;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const activeMessages = activeTab === "chat" ? chatMessages : callMessages;

  useEffect(() => {
    userScrolledUpRef.current = false;
    scrollToBottom();
  }, [chatMessages.length, callMessages.length, loading, activeTab]);

  // Auto-scroll during typewriter streaming
  useEffect(() => {
    if (streamingIndex !== null) {
      const interval = setInterval(() => {
        if (!userScrolledUpRef.current) {
          scrollToBottom("auto");
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [streamingIndex]);

  const openReference = async (ref: ChatRef) => {
    try {
      if (setCodeflowSelectedFile && setCodeflowRightTab && setCodeflowHighlightRange) {
        setCodeflowSelectedFile(ref.file);
        setCodeflowHighlightRange({
          startLine: ref.startLine || 1,
          endLine: ref.endLine || ref.startLine || 1,
        });
        setCodeflowRightTab("code");
        return;
      }

      const res = await api.get("/files/content", {
        params: { repoId, path: ref.file },
      });

      if (setEditorState) {
        setEditorState({
          filePath: ref.file,
          content: res.data.content,
          language: getLanguage(ref.file),
          startLine: ref.startLine,
          endLine: ref.endLine,
        });
      } else if (setFilePreview) {
        setFilePreview({
          path: ref.file,
          content: res.data.content,
          language: getLanguage(ref.file),
        });
      }
    } catch (err) {
      console.error("Open reference error:", err);
    }
  };

  const handleBlastRadiusClick = (file: string, name: string) => {
    const nodeId = name ? `${file}::${name}` : file;
    router.push(`/mitorixSpace/${repoId}?blastRadius=${encodeURIComponent(nodeId)}`);
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
    <div className="flex flex-col h-full bg-transparent relative">
      <div className="border-b border-[#1a1a1a] bg-[#050505]/90 backdrop-blur-md sticky top-0 z-10 flex flex-col shadow-sm">
        <div className="p-4 flex flex-row items-center justify-between">
          <h3 className="text-xs font-bold tracking-widest uppercase text-[#e5e5e5] flex items-center gap-2">
            <Bot size={16} className="text-[#ff6b00]" />
            Mitorix AI
          </h3>
          <div className="flex items-center gap-2">
            {callState === "listening" && (
              <div className="text-xs text-[#ff6b00] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Mic size={12} /> Recording
              </div>
            )}
            {callState === "processing" && (
              <div className="text-xs text-[#ff8c00] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Thinking
              </div>
            )}
            {callState === "speaking" && (
              <div className="text-xs text-[#ffa800] font-semibold animate-pulse mr-2 flex items-center gap-1">
                <Bot size={12} /> Speaking
              </div>
            )}

            {/* Delete Chat Button */}
            {activeMessages.length > 0 && (
              <button
                onClick={handleDeleteChat}
                className="cursor-pointer p-1.5 rounded-lg text-[#737373] hover:text-[#ff4500] hover:bg-[#ff4500]/10 active:scale-90 transition-all duration-200"
                title={`Clear ${activeTab} history`}
              >
                <Trash2 size={14} />
              </button>
            )}

            <div
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${
                callState === "listening"
                  ? "text-[#ff6b00] bg-[#ff6b00]"
                  : callState === "processing"
                    ? "text-[#ff8c00] bg-[#ff8c00]"
                    : callState === "speaking"
                      ? "text-[#ffa800] bg-[#ffa800]"
                      : "text-[#ff6b00] bg-[#ff6b00]"
              }`}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab("chat")}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "chat" ? "text-[#ff6b00] border-b-2 border-[#ff6b00] bg-[#000000]" : "text-[#737373] hover:text-[#e5e5e5] hover:bg-[#0a0a0a]"}`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => {
              if (!hasFeature("chat:voice")) {
                toast.error("🔒 Voice call requires the PRO plan. Upgrade to unlock.", { id: "voice-locked" });
                return;
              }
              setActiveTab("call");
            }}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "call" ? "text-[#ff8c00] border-b-2 border-[#ff8c00] bg-[#000000]" : "text-[#737373] hover:text-[#e5e5e5] hover:bg-[#0a0a0a]"} ${!hasFeature("chat:voice") ? "opacity-70" : ""}`}
            title={hasFeature("chat:voice") ? "Voice Call" : "Requires PRO plan"}
          >
            <Phone size={14} />
            Call
          </button>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-4 space-y-6 bg-transparent custom-scrollbar relative z-0`}
        onScroll={handleScroll}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-l from-[#ff6b00]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>

        {activeMessages.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#050505] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-inner">
              <Bot className="h-8 w-8 text-[#ff6b00]" />
            </div>
            <p className="text-base font-medium text-[#e5e5e5] mb-2">
              {activeTab === "chat"
                ? "How can I help with this codebase?"
                : "Speak your mind with Mitorix"}
            </p>
            <p className="text-sm text-[#737373]">
              {activeTab === "chat"
                ? "Ask for architecture details, exact files, or component logic."
                : "I'm listening and ready to dive into the code with you."}
            </p>
          </div>
        ) : (
          activeMessages.map((msg: ChatMessage, i: number) => {
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
                      ? "bg-gradient-to-br from-[#0a0a0a] to-[#050505] border border-[#1a1a1a]/50 rounded-tr-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_4px_25px_rgba(255,255,255,0.02)]"
                      : "glass-panel border border-[rgba(255,255,255,0.02)] border-l-2 border-l-[#ff6b00]/50 rounded-tl-sm shadow-[0_4px_25px_rgba(0,0,0,0.8)] group-hover:shadow-[0_8px_30px_rgba(255,107,0,0.05)]"
                  }`}
                >
                  <div
                    className={`px-4 py-2 text-[11px] font-bold tracking-wide uppercase flex items-center gap-2 transition-all duration-300 ${
                      msg.role === "user"
                        ? "text-[#e5e5e5] justify-end"
                        : "text-[#ff6b00] border-b border-[rgba(255,255,255,0.02)] bg-[rgba(0,0,0,0.4)]"
                    }`}
                  >
                    {msg.role === "assistant" && <Bot size={14} className="text-[#ff6b00]" />}
                    {msg.role === "user" ? "You" : "Mitorix"}
                    {msg.role === "user" && <User size={14} className="text-[#737373]" />}
                  </div>
                  <div className="p-4 text-[13px] sm:text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed font-sans">
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
                                  className="cursor-pointer mt-2 self-start py-2 px-4 flex items-center justify-center gap-2 bg-[#ff4500]/10 hover:bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30 hover:border-[#ff4500] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,69,0,0.15)] hover:shadow-[0_0_20px_rgba(255,69,0,0.3)]"
                                >
                                  <Flame size={16} /> Visualize Blast Radius in Graph
                                </button>
                              )}
                            </div>
                          );
                        })()
                      : msg.content}
                  </div>

                  {/* Show attached context chips on user messages */}
                  {msg.role === "user" &&
                    ((msg.attachedNodes && msg.attachedNodes.length > 0) ||
                      (msg.attachments && msg.attachments.length > 0)) && (
                      <div className="flex flex-wrap gap-1 px-4 pb-3 border-t border-[#1a1a1a]/30 pt-2">
                        {((msg.attachedNodes || msg.attachments) ?? []).map(
                          (n: DraggedContextNode) => (
                            <span
                              key={n.id}
                              className="text-[10px] bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded px-2 py-0.5 text-[#ff6b00] font-mono inline-flex items-center gap-1"
                            >
                              {entityIcons[n.type] || "📎"} {n.name}
                            </span>
                          )
                        )}
                      </div>
                    )}
                </div>

                {msg.references && msg.references.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full max-w-[85%] self-start ml-2">
                    <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-1">
                      References
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.references.map((ref: ChatRef, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => openReference(ref)}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] bg-[#050505] border border-[#1a1a1a] hover:border-[#ff6b00] hover:bg-[#ff6b00]/10 rounded-lg px-2.5 py-1.5 text-[#e5e5e5] transition-all shadow-sm group"
                          title="Click to view in editor"
                        >
                          <Code2 className="w-3.5 h-3.5 text-[#ff6b00] group-hover:scale-110 transition-transform" />
                          <span className="font-mono">{ref.file.split("/").pop()}</span>
                          <span className="text-[#737373] font-mono">L{ref.startLine}</span>
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
            <div className="max-w-[85%] glass-panel border border-[rgba(255,255,255,0.02)] border-l-2 border-l-[#ff6b00]/50 rounded-2xl rounded-tl-sm overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              <div className="px-4 py-2 text-[11px] font-bold tracking-wide uppercase border-b border-[rgba(255,255,255,0.02)] bg-[rgba(0,0,0,0.4)] text-[#ff6b00] flex items-center gap-2">
                <Bot size={14} className="text-[#ff6b00]" />
                Mitorix
              </div>
              <div className="p-5 text-[13px] text-[#737373] flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-[#ff6b00] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[#ff6b00] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#ff6b00] rounded-full animate-bounce"></div>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {activeTab === "chat" ? (
        <div
          ref={chatInputAreaRef}
          className="px-4 py-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent relative z-10 w-full pt-10 mt-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div
            className={`glass-panel border rounded-2xl focus-within:border-[#ff6b00]/50 focus-within:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all duration-300 flex flex-col relative shadow-inner p-1 ${
              dropHighlight || isDragging
                ? "border-[#ff6b00] shadow-[0_0_20px_rgba(255,107,0,0.25)] ring-2 ring-[#ff6b00]/20"
                : "border-[#1a1a1a]"
            }`}
          >
            {/* Context Chips */}
            {attachedNodes && attachedNodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-1">
                {attachedNodes.map((node: DraggedContextNode) => (
                  <div
                    key={node.id}
                    className="inline-flex items-center gap-1.5 text-[11px] bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-lg px-2.5 py-1.5 text-[#ff6b00] font-medium animate-fadeInUp group/chip"
                  >
                    <span className="text-[#737373]">{entityIcons[node.type] || "📎"}</span>
                    <span className="font-mono truncate max-w-[120px]">{node.name}</span>
                    <button
                      onClick={() =>
                        setAttachedNodes &&
                        setAttachedNodes((prev: DraggedContextNode[]) =>
                          prev.filter((n) => n.id !== node.id)
                        )
                      }
                      className="ml-0.5 p-0.5 rounded-full hover:bg-[#ff4500]/20 text-[#737373] hover:text-[#ff4500] transition cursor-pointer opacity-0 group-hover/chip:opacity-100"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone indicator */}
            {(dropHighlight || isDragging) && attachedNodes?.length === 0 && (
              <div className="px-3 pt-3 pb-1 flex items-center gap-2 text-[11px] text-[#ff6b00] font-medium animate-pulse">
                <GripVertical size={12} />
                Drop here to attach context
              </div>
            )}

            <div className="flex items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedNodes?.length > 0
                    ? "Ask about the attached items..."
                    : "Ask anything about this repo..."
                }
                className="flex-1 bg-transparent px-4 py-3 text-[13px] text-[#e5e5e5] focus:outline-none resize-none min-h-[44px] max-h-[150px] overflow-y-auto placeholder:text-[#737373] custom-scrollbar"
                disabled={loading}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={
                  loading || (!input.trim() && (!attachedNodes || attachedNodes.length === 0))
                }
                className="mb-1 mr-1 p-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff8c00] active:scale-95 text-white disabled:opacity-50 disabled:bg-[#1a1a1a] disabled:text-[#737373] transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,107,0,0.2)] border border-[#ff8c00]/30 disabled:border-transparent shrink-0"
              >
                <Send
                  size={16}
                  className={
                    loading || (!input.trim() && (!attachedNodes || attachedNodes.length === 0))
                      ? ""
                      : "translate-x-[-1px]"
                  }
                />
              </button>
            </div>
          </div>
          <div className="w-full mt-3 flex justify-center">
            <span className="text-[10px] text-[#737373] font-medium tracking-wide opacity-80 flex items-center gap-1.5">
              Mitorix Assistant <span className="w-1 h-1 rounded-full bg-[#1a1a1a]"></span> AI can
              make mistakes
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 bg-[#000000] border-t border-[#1a1a1a] relative z-10 flex flex-col items-center justify-center min-h-[160px]">
          <audio ref={audioRef} className="hidden" />

          {callState === "idle" ? (
            <>
              <button
                onClick={startListeningPhase}
                className="cursor-pointer w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-[#ff6b00] border border-[#ff6b00] text-white hover:bg-[#ff8c00] hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
              >
                <Phone size={32} />
              </button>
              <span className="text-xs mt-4 tracking-wide font-medium text-[#737373]">
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
                        className="w-[4px] rounded-full bg-[#ff6b00] transition-all duration-100"
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
                      className={`w-16 h-16 rounded-full bg-[#0a0a0a] border-2 border-[#ff6b00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.3)] ${audioLevel > SILENCE_THRESHOLD ? "scale-105" : "scale-100"} transition-transform duration-150`}
                    >
                      <Mic className="w-8 h-8 text-[#ff6b00]" />
                    </div>
                  )}
                  {callState === "processing" && (
                    <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border-2 border-[#ff8c00] flex items-center justify-center shadow-[0_0_15px_rgba(255,140,0,0.3)]">
                      <Loader2 className="w-8 h-8 text-[#ff8c00] animate-spin" />
                    </div>
                  )}
                  {callState === "speaking" && (
                    <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border-2 border-[#ffa800] flex items-center justify-center shadow-[0_0_15px_rgba(255,168,0,0.3)] animate-pulse">
                      <Bot className="w-8 h-8 text-[#ffa800]" />
                    </div>
                  )}
                </div>

                <button
                  onClick={cleanupCall}
                  className="cursor-pointer w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-[#ff3300] text-white shadow-[0_4px_15px_rgba(255,51,0,0.4)] hover:bg-[#cc2900] hover:scale-105 active:scale-95"
                  title="End Call"
                >
                  <PhoneOff size={24} />
                </button>
              </div>

              <span
                className={`text-sm tracking-wide font-medium ${
                  callState === "listening"
                    ? "text-[#ff6b00]"
                    : callState === "processing"
                      ? "text-[#ff8c00]"
                      : "text-[#ffa800]"
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
