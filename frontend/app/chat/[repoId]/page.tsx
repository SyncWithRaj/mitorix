"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

import CodeEditor from "@/components/editor/CodeEditor";
import FileExplorer from "@/components/files/FileExplorer";
import ChatPanel from "@/components/chat/ChatPanel";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Files, MessageSquare, Settings } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import toast from "react-hot-toast";

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python', rb: 'ruby', java: 'java',
    go: 'go', rs: 'rust', c: 'c', cpp: 'cpp',
    html: 'html', css: 'css', json: 'json', md: 'markdown'
  };
  return map[ext || ''] || 'plaintext';
};

export default function ChatPage() {
  const { repoId } = useParams();
  const router = useRouter();
  const { setEditorState } = useEditor();


  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [callMessages, setCallMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [repoValid, setRepoValid] = useState<boolean | null>(null);
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);

  useEffect(() => {
    const checkRepo = async () => {
      try {
        const res = await api.get(`/repos/${repoId}`);
        if (res.data.repo) setRepoValid(true);
        else router.push("/404");
      } catch {
        router.push("/404");
      }
    };

    if (repoId) checkRepo();
  }, [repoId]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const chatRes = await api.get(`/history/${repoId}?type=chat`);
        if (chatRes.data.success) {
           setChatMessages(chatRes.data.messages || []);
        }
        const callRes = await api.get(`/history/${repoId}?type=call`);
        if (callRes.data.success) {
           setCallMessages(callRes.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    if (repoValid) {
       fetchHistory();
    }
  }, [repoValid, repoId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setChatMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/query/ask", {
        repoId,
        question: input,
      });

      const aiMsg = {
        role: "assistant",
        content: res.data.answer,
        references: res.data.references || [],
      };

      if (res.data.references?.length > 0) {
        const ref = res.data.references[0];

        try {
          const fileRes = await api.get("/files/content", {
            params: { repoId, path: ref.file },
          });

          setEditorState({
            filePath: ref.file,
            content: fileRes.data.content,
            language: getLanguage(ref.file),
            startLine: ref.startLine,
            endLine: ref.endLine
          });
        } catch (err) {
          console.warn(`Failed to auto-open reference file (${ref.file}) - it might not exist.`);
        }
      }

      setChatMessages((prev) => {
        const newMessages = [...prev, aiMsg];
        // Set streaming index to the new assistant message
        setStreamingIndex(newMessages.length - 1);
        return newMessages;
      });
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      toast.error("Failed to get response. Please try again.");
    }

    setLoading(false);
  };

  const handleDeleteChat = async (type: "chat" | "call") => {
    try {
      await api.delete(`/history/${repoId}?type=${type}`);
      if (type === "chat") {
        setChatMessages([]);
      } else {
        setCallMessages([]);
      }
      setStreamingIndex(null);
    } catch (err) {
      console.error("Delete chat error:", err);
      toast.error("Failed to delete chat history");
    }
  };

  const [activeSidebar, setActiveSidebar] = useState<"files" | "none">("files");
  const [showChat, setShowChat] = useState(true);

  if (repoValid === null) {
    return (
      <div className="h-screen flex items-center justify-center text-[#c9d1d9] bg-[#0d1117] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#58a6ff]/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow"></div>
        <div className="flex flex-col items-center relative z-10">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#58a6ff]/20 blur-sm"></div>
          </div>
          <p className="text-lg font-medium text-white tracking-wide">Initializing Workspace...</p>
          <p className="text-sm text-[#8b949e] mt-2">Loading editor, graph, and neural pathways</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => setActiveSidebar(prev => prev === "files" ? "none" : "files");
  const toggleChat = () => setShowChat(!showChat);

  return (
    <div className="flex flex-grow overflow-hidden bg-[#0a0c10] text-[#c9d1d9] font-sans h-[calc(100vh-700px)] p-3 gap-3 relative mt-22">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#a371f7]/5 via-[#58a6ff]/5 to-transparent blur-[120px] rounded-full pointer-events-none mix-blend-screen -z-0"></div>

      {/* Activity Bar */}
      <div className="w-[56px] min-w-[56px] flex flex-col items-center py-5 bg-[#161b22]/90 backdrop-blur-xl rounded-2xl border border-[#30363d] shadow-sm z-10 space-y-5">
        <button 
          onClick={toggleSidebar}
          className={`cursor-pointer p-2.5 rounded-xl transition-colors relative group ${activeSidebar === "files" ? "text-white bg-[#30363d] shadow-md border border-[#484f58]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent"}`}
          title="Explorer"
        >
          <Files size={22} strokeWidth={1.5} />
        </button>
        <button 
          onClick={toggleChat}
          className={`cursor-pointer p-2.5 rounded-xl transition-colors relative group ${showChat ? "text-white bg-[#30363d] shadow-md border border-[#484f58]" : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent"}`}
          title="Chat Panel"
        >
          <MessageSquare size={22} strokeWidth={1.5} />
        </button>
        <div className="flex-grow"></div>
        <button className="cursor-pointer p-2.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-all duration-300 rounded-xl mb-2 focus:outline-none" title="Settings">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Resizable Panels Container */}
      <div className="flex-grow h-full overflow-hidden">
        <Group orientation="horizontal" className="w-full h-full">
          {/* File Explorer Panel */}
          {activeSidebar === "files" && (
            <Panel defaultSize={18} minSize={10} className="h-full pr-1">
              <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col">
                <FileExplorer repoId={repoId} />
              </div>
            </Panel>
          )}

          {activeSidebar === "files" && (
            <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity flex-shrink-0">
              <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
            </Separator>
          )}

          {/* Code Editor Panel */}
          <Panel defaultSize={57} minSize={20} className="h-full min-w-[200px]">
            <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col pt-0">
              <CodeEditor />
            </div>
          </Panel>

          {/* Chat Panel Segment */}
          {showChat && (
            <Separator className="w-2 flex items-center justify-center cursor-col-resize group relative hover:opacity-100 transition-opacity flex-shrink-0">
              <div className="h-10 w-1 bg-[#30363d] rounded-full group-hover:bg-[#58a6ff] transition-colors" />
            </Separator>
          )}
          
          {showChat && (
            <Panel defaultSize={25} minSize={15} className="h-full pl-1">
              <div className="h-full bg-[#0d1117] rounded-xl border border-[#30363d] overflow-hidden shadow-sm flex flex-col">
                <ChatPanel
                  repoId={repoId as string}
                  chatMessages={chatMessages}
                  callMessages={callMessages}
                  input={input}
                  setInput={setInput}
                  sendMessage={sendMessage}
                  addCallMessages={(newMsgs: any[]) => setCallMessages(prev => [...prev, ...newMsgs])}
                  loading={loading}
                  streamingIndex={streamingIndex}
                  onStreamComplete={() => setStreamingIndex(null)}
                  onDeleteChat={handleDeleteChat}
                />
              </div>
            </Panel>
          )}
        </Group>
      </div>
    </div>
  );
}