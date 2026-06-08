"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Box,
  Loader2,
  Trash2,
  Github,
  Plus,
  Activity,
  Folder,
  Archive,
  Search,
  Database,
  Link as LinkIcon,
  Server,
  TerminalSquare,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  FileCode,
} from "lucide-react";
import JSZip from "jszip";
import api from "@/lib/axios";
import toast from "react-hot-toast";

function RepoProgressTracker({ jobId, onComplete }: { jobId: string; onComplete: () => void }) {
  const [status, setStatus] = useState("connecting...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const eventSource = new EventSource(`${baseUrl}/repos/jobs/${jobId}/status`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data.status);
        if (data.progress !== undefined) setProgress(Number(data.progress));

        if (data.status === "completed" || data.status === "failed") {
          eventSource.close();
          if (data.status === "completed") {
            setTimeout(() => onComplete(), 1000);
          }
        }
      } catch (e) {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [jobId, onComplete]);

  return (
    <div className="w-full mt-4 bg-[#080808] border border-[#1f1f1f] rounded-2xl p-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-bold font-mono text-[#a3a3a3] uppercase tracking-widest flex items-center gap-2.5">
          <Loader2 size={13} className="animate-spin text-[#ff6b00]" />
          {status}
        </span>
        <span className="text-xs font-bold font-mono text-[#ff6b00]">{progress}%</span>
      </div>
      <div className="w-full bg-[#141414] rounded-full h-2 overflow-hidden border border-[#222222]">
        <div
          className="bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa800] h-full rounded-full transition-all duration-300 ease-out relative shadow-[0_0_10px_rgba(255,107,0,0.5)]"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  const [repos, setRepos] = useState<any[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [embeddingStates, setEmbeddingStates] = useState<Record<string, { current: number; total: number; completed: boolean }>>({});
  const activeEventSources = useRef<Set<string>>(new Set());

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress("Zipping folder locally...");

      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        zip.file(file.webkitRelativePath || file.name, file);
      }

      setUploadProgress("Uploading and parsing folder...");
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const formData = new FormData();
      formData.append("file", zipBlob, "folder.zip");
      formData.append("name", files[0].webkitRelativePath?.split("/")[0] || "local_folder");

      const res = await api.post("/repos/upload-local", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Folder uploaded! Analysis started in the background.");
        fetchRepos();
      } else {
        toast.error("Failed to process uploaded folder.");
      }
    } catch (err: any) {
      console.error("Folder upload failed:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to upload folder.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress("Uploading and parsing ZIP archive...");

      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await api.post("/repos/upload-local", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("ZIP archive uploaded! Analysis started in the background.");
        fetchRepos();
      } else {
        toast.error("Failed to process uploaded ZIP.");
      }
    } catch (err: any) {
      console.error("ZIP upload failed:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to upload ZIP.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const fetchRepos = useCallback(async () => {
    try {
      const res = await api.get("/repos");
      const fetchedRepos = res.data.repos || [];
      setRepos(fetchedRepos);
    } catch (err) {
      console.error("Fetch repos error:", err);
      setRepos([]);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/me");
        fetchRepos();
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [fetchRepos]);

  useEffect(() => {
    repos.forEach((repo) => {
      if (repo.isEmbedding && !activeEventSources.current.has(repo._id)) {
        activeEventSources.current.add(repo._id);
        embedRepo(repo._id, true);
      }
    });
  }, [repos]);

  const processRepo = async () => {
    if (!githubUrl) return;
    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading("Queuing repository for cloning...");
      await api.post("/repos/process", { githubUrl });
      setGithubUrl("");
      toast.success("Analysis started in the background!", { id: toastId });
      setTimeout(() => fetchRepos(), 500);
    } catch (err: any) {
      console.error("Process repo error:", err);
      toast.error(
        err.response?.data?.message || "Failed to start analysis. Check the URL and try again.",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteRepo = async (repoId: string) => {
    const confirmDelete = confirm(
      "NUCLEAR OPTION: Are you sure you want to nuke this repository? This will instantly and irreversibly delete all your code data, vectors, and chat history."
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/repos/${repoId}`);
      toast.success("Repository deleted successfully");
      fetchRepos();
    } catch (err) {
      console.error("Delete repo error:", err);
      toast.error("Failed to delete repository");
    }
  };

  const embedRepo = async (repoId: string, silent: boolean = false) => {
    let toastId: string | undefined;
    try {
      if (!silent) {
        toastId = toast.loading("Connecting to Vector Engine...");
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const eventSource = new EventSource(`${baseUrl}/repos/${repoId}/trigger-embedding`, {
        withCredentials: true,
      });

      setEmbeddingStates(prev => ({
        ...prev,
        [repoId]: { current: 0, total: 1, completed: false }
      }));

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.status === "completed") {
            if (!silent) toast.success("Embeddings generated & stored in Qdrant successfully!", { id: toastId });
            setEmbeddingStates(prev => ({
              ...prev,
              [repoId]: { current: data.total || 1, total: data.total || 1, completed: true }
            }));
            eventSource.close();
            activeEventSources.current.delete(repoId);
            fetchRepos();
          } else if (data.status === "progress") {
            if (!silent && toastId) {
              toast.loading(`Embedding items: ${data.current} / ${data.total}`, { id: toastId });
            }
            setEmbeddingStates(prev => ({
              ...prev,
              [repoId]: { current: data.current, total: data.total, completed: false }
            }));
          } else if (data.status === "error") {
            if (!silent) toast.error(data.message || "Failed to generate embeddings", { id: toastId });
            eventSource.close();
            activeEventSources.current.delete(repoId);
            setEmbeddingStates(prev => {
              const newState = { ...prev };
              delete newState[repoId];
              return newState;
            });
          }
        } catch (e) {
          console.error("SSE Parse error", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        activeEventSources.current.delete(repoId);
        if (!silent) toast.error("Connection lost while generating embeddings.", { id: toastId });
        setEmbeddingStates(prev => {
          const newState = { ...prev };
          delete newState[repoId];
          return newState;
        });
      };
    } catch (err: any) {
      console.error("Embed repo error:", err);
      if (!silent) toast.error(err.message || "Failed to start generating embeddings", { id: toastId });
      activeEventSources.current.delete(repoId);
    }
  };

  const indexedRepos = repos.filter(r => r.status === "indexed");
  const embeddedCount = repos.filter(r => r.isEmbedded).length;

  return (
    <div className="w-full min-h-screen bg-[#020202] flex flex-col pt-32 pb-24 relative selection:bg-[#ff6b00] selection:text-white overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-[-10%] w-[70vw] h-[70vw] max-w-[900px] bg-gradient-to-br from-[#ff6b00]/5 via-[#ffa800]/2 to-transparent blur-[140px] rounded-full pointer-events-none mix-blend-screen animate-glow-pulse"></div>
      <div className="absolute bottom-[5%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] bg-gradient-to-tr from-[#ff8c00]/4 to-[#ffa800]/1 to-transparent blur-[150px] rounded-full pointer-events-none mix-blend-screen animate-float"></div>
      
      {/* Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_30%,transparent_100%)] pointer-events-none"></div>

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      <div className="max-w-6xl mx-auto w-full px-6 flex-grow relative z-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#18181b] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(255,107,0,0.1)]">
              <Server size={13} className="animate-pulse" /> Active Workspace Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
              Workspace Dashboard
            </h1>
            <p className="text-[#a3a3a3] mt-3 text-base font-light max-w-xl leading-relaxed">
              Launch into high-fidelity code spaces, sync vectorized semantic context in Qdrant, and review parsing queue statuses.
            </p>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="bg-[#09090b]/80 backdrop-blur-xl border border-[#1f1f23] rounded-2xl px-5 py-4 flex items-center gap-4 shadow-xl shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center shadow-inner">
                <Box className="text-[#ff6b00] w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Active Spaces</span>
                <span className="text-base font-mono font-bold text-white">{repos.length} Created</span>
              </div>
            </div>

            <div className="bg-[#09090b]/80 backdrop-blur-xl border border-[#1f1f23] rounded-2xl px-5 py-4 flex items-center gap-4 shadow-xl shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#ffa800]/10 border border-[#ffa800]/20 flex items-center justify-center shadow-inner">
                <Database className="text-[#ffa800] w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Vectorized</span>
                <span className="text-base font-mono font-bold text-white">{embeddedCount} synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Provision Card */}
        <div className="bg-gradient-to-b from-[#09090b]/90 to-[#030303]/95 backdrop-blur-2xl border border-[#1f1f23] rounded-3xl p-5 md:py-6 md:px-7 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-[#ff6b00]/5 via-transparent to-transparent blur-3xl rounded-full pointer-events-none group-hover:from-[#ff6b00]/10 transition-all duration-700"></div>

          <h2 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center gap-3">
            <Plus size={18} className="text-[#ff6b00] border border-[#ff6b00]/25 rounded-md p-0.5 bg-[#ff6b00]/5" />
            Provision a new RepoSpace
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 relative z-10">
            {/* Git URL Input */}
            <div className="flex-grow flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none">
                  <LinkIcon className="h-4.5 w-4.5 text-[#737373]" />
                </div>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#030303] border border-[#1f1f23] text-sm text-white focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] placeholder-[#52525b]"
                />
              </div>
              <button
                onClick={processRepo}
                disabled={loading || !githubUrl}
                className="group/btn relative cursor-pointer text-xs text-white font-bold px-7 py-2.5 rounded-xl transition-all duration-300 active:scale-[0.98] border border-[#ff8c00]/30 shadow-[0_4px_20px_rgba(255,107,0,0.2)] hover:shadow-[0_0_35px_rgba(255,107,0,0.45)] flex items-center justify-center min-w-[160px] overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa800]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clone & Index"}
                  {!loading && <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-[#18181b] flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
            <div className="text-xs text-[#737373] font-medium flex items-center gap-3">
              {uploading ? (
                <span className="flex items-center gap-2 text-[#ff6b00] font-mono">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress}
                </span>
              ) : (
                <>
                  <TerminalSquare size={16} className="text-[#a1a1aa]" />
                  <span>Or ingest a local codebase directly from files:</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                type="file"
                id="folder-upload-input"
                style={{ display: "none" }}
                onChange={handleFolderUpload}
                // @ts-ignore
                webkitdirectory=""
                directory=""
              />
              <button
                onClick={() => document.getElementById("folder-upload-input")?.click()}
                disabled={loading || uploading}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0c0c0e] hover:bg-[#141416] border border-[#1f1f23] text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-[#ff6b00]/40 shadow-md group/upload"
              >
                <Folder size={14} className="text-[#ff6b00] group-hover/upload:scale-105 transition-transform" />
                Upload Folder
              </button>

              <input
                type="file"
                id="zip-upload-input"
                accept=".zip"
                style={{ display: "none" }}
                onChange={handleZipUpload}
              />
              <button
                onClick={() => document.getElementById("zip-upload-input")?.click()}
                disabled={loading || uploading}
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0c0c0e] hover:bg-[#141416] border border-[#1f1f23] text-white text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-[#ffa800]/40 shadow-md group/zip"
              >
                <Archive size={14} className="text-[#ffa800] group-hover/zip:scale-105 transition-transform" />
                Upload ZIP
              </button>
            </div>
          </div>
        </div>

        {/* Repository Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Sparkles size={16} className="text-[#ff6b00]" />
              Your Codebases
            </h2>
            <span className="text-xs font-mono font-semibold text-[#52525b]">{repos.length} space(s) registered</span>
          </div>

          {repos.length === 0 ? (
            <div className="text-center py-32 px-6 bg-gradient-to-b from-[#050507] to-[#020203] border border-dashed border-[#1f1f23] rounded-3xl flex flex-col items-center shadow-lg">
              <div className="w-20 h-20 rounded-2xl bg-[#09090b] border border-[#1f1f23] flex items-center justify-center mb-6 shadow-inner relative">
                <GitBranch className="h-9 w-9 text-[#3f3f46]" />
                <div className="absolute inset-0 bg-[#ff6b00]/5 opacity-0 hover:opacity-100 blur-md rounded-2xl transition-opacity pointer-events-none"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2.5 tracking-tight">No RepoSpaces Provisioned</h3>
              <p className="text-sm text-[#71717a] max-w-sm leading-relaxed">
                Paste a public GitHub repository link or import a local codebase to begin the high-fidelity AST parsing pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {repos.map((repo, index) => (
                <div
                  key={repo._id}
                  className="group bg-gradient-to-b from-[#070708]/90 to-[#030304]/95 backdrop-blur-2xl border border-[#18181b] p-4.5 sm:py-5 sm:px-6 rounded-2xl flex flex-col lg:flex-row justify-between lg:items-center gap-6 hover:border-[#ff6b00]/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-500 relative overflow-hidden"
                >
                  {/* Glowing left bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#18181b] group-hover:bg-gradient-to-b from-[#ff6b00] to-[#ffa800] transition-all duration-500"></div>

                  <div className="flex-grow space-y-3 ml-2">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#0d0d0f] border border-[#1f1f23] flex items-center justify-center shadow-inner group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/30 transition-all duration-500 shrink-0">
                        <Github className="w-5.5 h-5.5 text-[#a1a1aa] group-hover:text-[#ff6b00] transition-colors duration-500" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#ff6b00] transition-colors truncate">
                          {repo.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold bg-[#0d0d0f] px-2.5 py-1 rounded border border-[#1f1f23]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                repo.status === "failed"
                                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"
                                  : repo.status === "cloning" || repo.status === "indexing"
                                    ? "bg-[#ffb700] animate-pulse shadow-[0_0_8px_rgba(255,183,0,0.6)]"
                                    : repo.status === "indexed"
                                      ? "bg-[#ff6b00] shadow-[0_0_8px_rgba(255,107,0,0.6)]"
                                      : "bg-orange-400"
                              }`}
                            ></span>
                            <span className="text-[#a1a1aa] tracking-widest">{repo.status.toUpperCase()}</span>
                          </span>

                          <span className="text-xs font-mono text-[#52525b] truncate max-w-[200px] hidden sm:block">
                            Branch: <code className="text-[#a1a1aa] bg-[#0c0c0e] px-1.5 py-0.5 rounded border border-[#1f1f23]">{repo.defaultBranch}</code>
                          </span>

                          {repo.commitHash && (
                            <span className="text-xs font-mono text-[#52525b] hidden md:block">
                              Hash: <code className="text-[#888]">{repo.commitHash.substring(0, 7)}</code>
                            </span>
                          )}
                          
                          {repo.status === "failed" && (
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1.5 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                              <AlertTriangle size={12} /> Pipeline failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Injector */}
                    {repo.jobId && repo.status !== "indexed" && repo.status !== "failed" && (
                      <RepoProgressTracker jobId={repo.jobId} onComplete={fetchRepos} />
                    )}
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-2.5 shrink-0 lg:ml-8 ml-2">
                    {repo.status === "indexed" && (
                      <>
                        {(repo.isEmbedding || (embeddingStates[repo._id] && !embeddingStates[repo._id].completed)) ? (
                          <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-xl border border-[#ffa800]/40 text-[#ffa800] bg-[#ffa800]/10">
                            <Loader2 size={14} className="animate-spin" />
                            <span>{embeddingStates[repo._id]?.current || 0} / {embeddingStates[repo._id]?.total || '-'}</span>
                          </div>
                        ) : !repo.isEmbedded && (
                          <button
                            onClick={() => embedRepo(repo._id)}
                            className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 border border-[#1f1f23] hover:border-[#ffa800]/40 text-[#a1a1aa] bg-[#0d0d0f] hover:bg-[#ffa800]/10"
                            title="Store codebase in Qdrant"
                          >
                            <Database size={14} className="text-[#ffa800]" />
                            <span>Init Qdrant</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/codeflow/${repo._id}`)}
                          className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs text-white font-bold px-4.5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_4px_15px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.45)] border border-[#ff6b00]/40 overflow-hidden bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa800] relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/action:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                          <Activity size={14} />
                          <span>Launch RepoSpace</span>
                        </button>
                        
                        <button
                          onClick={() => router.push(`/repolabs/${repo._id}`)}
                          className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs text-white font-semibold px-4.5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 border border-[#ff8c00]/40 hover:border-[#ff8c00]/80 bg-[#ff8c00]/10 hover:bg-[#ff8c00]/20 shadow-[0_0_15px_rgba(255,140,0,0.1)]"
                        >
                          <Search size={14} className="text-[#ff8c00]" />
                          <span>RepoLabs</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => deleteRepo(repo._id)}
                      disabled={repo.status === "cloning" || repo.status === "indexing"}
                      className="flex-1 sm:flex-none flex items-center justify-center w-auto sm:w-11 py-2.5 bg-[#0d0d0f] hover:bg-red-500/10 text-[#52525b] hover:text-red-500 border border-[#1f1f23] hover:border-red-500/30 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group/del"
                      title="Destroy Clone"
                    >
                      <Trash2 size={14} className="group-hover/del:scale-110 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
