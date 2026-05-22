"use client";

import { useEffect, useState, useCallback } from "react";
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
    <div className="w-full mt-4 bg-[#030303] border border-[#1a1a1a] rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold font-mono text-[#a3a3a3] uppercase tracking-widest flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-[#ff6b00]" />
          {status}
        </span>
        <span className="text-xs font-bold text-[#ff6b00]">{progress}%</span>
      </div>
      <div className="w-full bg-[#0a0a0a] rounded-full h-1.5 overflow-hidden border border-[#1a1a1a]">
        <div
          className="bg-gradient-to-r from-[#ff6b00] to-[#ffa800] h-full rounded-full transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_1.5s_infinite]"></div>
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

  const processRepo = async () => {
    if (!githubUrl) return;
    try {
      setLoading(true);
      toast.loading("Queuing repository for cloning...");
      await api.post("/repos/process", { githubUrl });
      setGithubUrl("");
      toast.success("Analysis started in the background!");
      fetchRepos();
    } catch (err: any) {
      console.error("Process repo error:", err);
      toast.error(
        err.response?.data?.message || "Failed to start analysis. Check the URL and try again."
      );
    }
    setLoading(false);
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

  const embedRepo = async (repoId: string) => {
    try {
      const toastId = toast.loading("Generating vector embeddings...");
      await api.post(`/repos/${repoId}/trigger-embedding`);
      toast.success("Embeddings generated & stored in Qdrant successfully!", { id: toastId });
      fetchRepos();
    } catch (err: any) {
      console.error("Embed repo error:", err);
      toast.error(err.response?.data?.message || "Failed to generate embeddings");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] flex flex-col pt-32 pb-20 relative selection:bg-[#ff6b00] selection:text-white">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] max-w-[800px] bg-gradient-to-bl from-[#ff6b00]/5 via-[#ffa800]/5 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      <div className="max-w-6xl mx-auto w-full px-6 flex-grow relative z-10 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#1a1a1a] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-mono uppercase tracking-wider mb-4">
              <Server size={14} /> Active RepoSpaces
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Repositories
            </h1>
            <p className="text-[#a3a3a3] mt-2 text-base font-light max-w-xl">
              Manage your indexed codebases, track telemetry status, and launch into the interactive architecture sandbox.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff6b00]/10 flex items-center justify-center">
                <Box className="text-[#ff6b00] w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Indexed</span>
                <span className="text-sm font-bold text-white">{repos.length} Repos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Section */}
        <div className="bg-[#030303] border border-[#1a1a1a] rounded-3xl p-8 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ff6b00]/5 to-transparent blur-3xl rounded-full pointer-events-none group-hover:bg-[#ff6b00]/10 transition-colors duration-700"></div>

          <h2 className="text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-3">
            <Plus size={20} className="text-[#ff6b00]" />
            Provision a new RepoSpace
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {/* Git URL Input */}
            <div className="flex-grow flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-[#737373]" />
                </div>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-xl bg-[#000000] border border-[#1a1a1a] text-white focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner placeholder-[#737373]"
                />
              </div>
              <button
                onClick={processRepo}
                disabled={loading || !githubUrl}
                className="group/btn relative cursor-pointer text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 active:scale-[0.98] border border-[#ff8c00]/30 shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] flex items-center justify-center min-w-[200px] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#ff6b00] to-[#ff8c00]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Clone & Index"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#1a1a1a] flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-sm text-[#737373] font-medium flex items-center gap-3">
              {uploading ? (
                <span className="flex items-center gap-2 text-[#ff6b00]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadProgress}
                </span>
              ) : (
                <>
                  <TerminalSquare size={18} className="text-[#737373]" />
                  <span>Or ingest a local codebase from your disk structure:</span>
                </>
              )}
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
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
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0a0a0a] hover:bg-[#121212] border border-[#1a1a1a] text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:border-[#ff6b00]/40 shadow-sm"
              >
                <Folder size={18} className="text-[#ff6b00]" />
                Directory
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
                className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0a0a0a] hover:bg-[#121212] border border-[#1a1a1a] text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:border-[#ffa800]/40 shadow-sm"
              >
                <Archive size={18} className="text-[#ffa800]" />
                ZIP Archive
              </button>
            </div>
          </div>
        </div>

        {/* Repository Grid */}
        <div className="space-y-6">
          {repos.length === 0 ? (
            <div className="text-center py-32 px-6 bg-[#030303] border border-dashed border-[#262626] rounded-3xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-inner">
                <GitBranch className="h-10 w-10 text-[#525252]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No RepoSpaces Indexed</h3>
              <p className="text-base text-[#737373] max-w-md">
                Paste a public GitHub repository URL above or upload a local directory to initiate the BullMQ cloning sequence.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {repos.map((repo, index) => (
                <div
                  key={repo._id}
                  className="group bg-[#030303] border border-[#1a1a1a] p-6 sm:p-8 rounded-3xl flex flex-col lg:flex-row justify-between lg:items-center gap-8 hover:border-[#ff6b00]/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-500 relative overflow-hidden"
                >
                  {/* Glowing vertical bar indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1a1a1a] group-hover:bg-gradient-to-b from-[#ff6b00] to-[#ffa800] transition-colors duration-500"></div>

                  <div className="flex-grow space-y-4 ml-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center shadow-inner group-hover:bg-[#ff6b00]/10 group-hover:border-[#ff6b00]/30 transition-colors shrink-0">
                        <Github className="w-6 h-6 text-[#737373] group-hover:text-[#ff6b00] transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-[#ff6b00] transition-colors">
                          {repo.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="flex items-center gap-2 text-xs font-mono font-medium bg-[#0a0a0a] px-3 py-1.5 rounded border border-[#1a1a1a]">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                repo.status === "failed"
                                  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"
                                  : repo.status === "cloning" || repo.status === "indexing"
                                    ? "bg-[#ffb700] animate-pulse shadow-[0_0_8px_rgba(255,183,0,0.6)]"
                                    : repo.status === "indexed"
                                      ? "bg-[#ff6b00] shadow-[0_0_8px_rgba(255,107,0,0.6)]"
                                      : "bg-orange-400"
                              }`}
                            ></span>
                            <span className="text-[#e5e5e5] tracking-widest">{repo.status.toUpperCase()}</span>
                          </span>
                          
                          {repo.status === "failed" && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
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

                  <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-3 shrink-0 lg:ml-8 ml-2">
                    {repo.status === "indexed" && (
                      <>
                        <button
                          onClick={() => router.push(`/codeflow/${repo._id}`)}
                          className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] border border-[#ff6b00]/40 overflow-hidden bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/action:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                          <Activity size={18} />
                          <span>RepoSpace</span>
                        </button>
                        
                        <button
                          onClick={() => embedRepo(repo._id)}
                          className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-[#e5e5e5] font-semibold px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-95 border border-[#1a1a1a] hover:border-[#ffa800]/50 bg-[#0a0a0a] hover:bg-[#ffa800]/10"
                          title={repo.isEmbedded ? "Re-index vectors for Drift Detection" : "Store codebase in Qdrant"}
                        >
                          <Database size={18} className="text-[#ffa800]" />
                          <span>{repo.isEmbedded ? "Sync Vectors" : "Init Qdrant"}</span>
                        </button>
                        
                        <button
                          onClick={() => router.push(`/repolabs/${repo._id}`)}
                          className="group/action flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-[#e5e5e5] font-semibold px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-95 border border-[#1a1a1a] hover:border-[#ff8c00]/50 bg-[#0a0a0a] hover:bg-[#ff8c00]/10"
                        >
                          <Search size={18} className="text-[#ff8c00]" />
                          <span> RepoLab</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => deleteRepo(repo._id)}
                      disabled={repo.status === "cloning" || repo.status === "indexing"}
                      className="flex-1 sm:flex-none flex items-center justify-center w-auto sm:w-14 px-6 sm:px-0 py-3.5 bg-[#0a0a0a] hover:bg-red-500/10 text-[#737373] hover:text-red-500 border border-[#1a1a1a] hover:border-red-500/30 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed group/del"
                      title="Destroy Clone"
                    >
                      <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
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
