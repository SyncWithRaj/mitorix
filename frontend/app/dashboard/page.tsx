"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Box,
  Loader2,
  Trash2,
  Github,
  Plus,
  Info,
  Activity,
  Folder,
  Archive,
  Search,
  Database,
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
    <div className="w-full mt-4 md:mt-0 md:ml-12 md:max-w-md space-y-2">
      <div className="flex justify-between text-xs text-[#737373] font-mono font-medium tracking-wide">
        <span>{status.toUpperCase()}</span>
        <span className="text-[#ff6b00]">{progress}%</span>
      </div>
      <div className="w-full bg-[#000000] rounded-full h-2 overflow-hidden border border-[#1a1a1a] shadow-inner">
        <div
          className="bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] h-2 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
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
      toast.loading("Analyzing repository...");
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
    <div className="max-w-6xl mt-20 mx-auto w-full py-12 px-6 flex-grow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Box className="text-[#ff6b00]" size={28} />
            Repositories
          </h1>
          <p className="text-[#737373] mt-2 text-sm font-medium">
            Manage and chat with indexed GitHub repositories in your isolated workspace.
          </p>
        </div>
      </div>

      <div className="mb-8 p-8 bg-gradient-to-br from-[#050505] to-[#000000] border border-[#1a1a1a] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] relative overflow-hidden group animate-fadeIn">
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
          }}
        ></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#ff6b00]/5 to-transparent blur-3xl rounded-full pointer-events-none group-hover:from-[#ff6b00]/10 transition-all duration-700 animate-glow-pulse"></div>

        <h2 className="text-lg font-medium text-white mb-4 relative z-10 flex items-center gap-2">
          <Plus size={18} className="text-[#ff6b00]" />
          Index a new repository
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Github className="h-5 w-5 text-[#737373]" />
            </div>
            <input
              type="url"
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#000000]/80 backdrop-blur-sm border border-[#1a1a1a] text-white focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-all shadow-inner placeholder-[#737373]"
            />
          </div>
          <button
            onClick={processRepo}
            disabled={loading || !githubUrl}
            className="group/btn relative cursor-pointer text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] border border-[#ff8c00]/30 whitespace-nowrap shadow-[0_0_20px_rgba(255,107,0,0.15)] hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] flex items-center justify-center min-w-[180px] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] transition-opacity duration-300 group-hover/btn:opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Codebase"}
            </span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-[#1a1a1a] flex flex-col sm:flex-row gap-4 relative z-10 items-center justify-between">
          <div className="text-xs text-[#737373] font-medium">
            {uploading ? (
              <span className="flex items-center gap-2 text-[#ff6b00]">
                <Loader2 className="w-4 h-4 animate-spin animate-infinite" />
                {uploadProgress}
              </span>
            ) : (
              "Or onboard a local codebase from your machine:"
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:border-[#ff6b00]/30"
            >
              <Folder size={16} className="text-[#ff6b00]" />
              Open Folder
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer hover:border-[#ff8c00]/30"
            >
              <Archive size={16} className="text-[#ff8c00]" />
              Open ZIP
            </button>
          </div>
        </div>
      </div>

      {/* Language Support Banner */}
      <div className="mb-8 p-4 bg-gradient-to-r from-[#050505] via-[#1a0f05]/30 to-[#050505] border border-[#1a1a1a] rounded-xl relative overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff6b00]/5 to-transparent animate-shimmer pointer-events-none"></div>
        <div className="flex items-start gap-3 relative z-10">
          <div className="flex-shrink-0 mt-0.5">
            <Info size={18} className="text-[#ff6b00]" />
          </div>
          <div>
            <p className="text-sm text-[#e5e5e5] font-medium">
              <span className="text-[#ff6b00] font-semibold">Currently supporting:</span>{" "}
              JavaScript, TypeScript, HTML, and CSS repositories.
            </p>
            <p className="text-xs text-[#737373] mt-1">
              More languages and frameworks will be supported in future updates. Stay tuned!
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {repos.length === 0 ? (
          <div className="text-center py-24 px-4 bg-[#050505]/50 border-2 border-dashed border-[#1a1a1a] rounded-3xl flex flex-col items-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#050505] border border-[#1a1a1a] flex items-center justify-center mb-6 shadow-inner">
              <GitBranch className="h-8 w-8 text-[#737373]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
            <p className="text-sm text-[#737373] max-w-sm">
              Get started by pasting a public GitHub repository URL above to clone and index it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {repos.map((repo, index) => (
              <div
                key={repo._id}
                className="group glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-[#050505]/80 transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] hover:border-[#ff6b00]/30 hover:-translate-y-0.5 relative overflow-hidden animate-fadeInUp"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Hover glow line */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#ff6b00] to-[#ff8c00] opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(255,107,0,0.8)]"></div>

                <div className="flex items-center flex-grow flex-wrap md:flex-nowrap">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center shadow-inner group-hover:border-[#ff6b00]/30 transition-colors shrink-0">
                      <GitBranch className="w-5 h-5 text-[#737373] group-hover:text-[#ff6b00] transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#ff6b00] transition-colors cursor-pointer flex items-center gap-2">
                        {repo.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#737373] font-mono">
                        <span className="flex items-center gap-2 font-medium bg-[#0a0a0a] px-2.5 py-1 rounded-md border border-[#1a1a1a]">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              repo.status === "failed"
                                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                : repo.status === "cloning" || repo.status === "indexing"
                                  ? "bg-[#ffb700] animate-pulse shadow-[0_0_8px_rgba(255,183,0,0.6)]"
                                  : repo.status === "indexed"
                                    ? "bg-[#ff6b00] shadow-[0_0_8px_rgba(255,107,0,0.6)]"
                                    : "bg-orange-400"
                            }`}
                          ></span>
                          {repo.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inject Live Progress Bar Here */}
                  {repo.jobId && repo.status !== "indexed" && repo.status !== "failed" && (
                    <RepoProgressTracker jobId={repo.jobId} onComplete={fetchRepos} />
                  )}
                </div>

                <div className="flex flex-wrap gap-3 items-center mt-4 md:mt-0 shrink-0">
                  {repo.status === "indexed" && (
                    <>
                      <button
                        onClick={() => router.push(`/codeflow/${repo._id}`)}
                        className="group/codeflow cursor-pointer relative flex items-center gap-2 text-sm text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(255,107,0,0.15)] hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] border border-[#ff8c00]/30 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] transition-opacity duration-300 group-hover/codeflow:opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/codeflow:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                        <span className="relative z-10 flex items-center gap-2">
                          <Activity size={16} />
                          RepoLens Intelligence
                        </span>
                      </button>
                      <button
                        onClick={() => embedRepo(repo._id)}
                        className="group/embed cursor-pointer relative flex items-center gap-2 text-sm text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 border border-[#1a1a1a] hover:border-[#ff6b00]/40 bg-[#0a0a0a] hover:bg-[#ff6b00]/10 overflow-hidden"
                        title={repo.isEmbedded ? "Re-index vectors for Drift Detection" : "Store codebase in Qdrant"}
                      >
                        <span className="relative z-10 flex items-center gap-2 text-[#ff6b00]">
                          <Database size={16} />
                          {repo.isEmbedded ? "Update Vectors" : "Store in Qdrant"}
                        </span>
                      </button>
                      <button
                        onClick={() => router.push(`/qdrant-lab/${repo._id}`)}
                        className="group/lab cursor-pointer relative flex items-center gap-2 text-sm text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(255,140,0,0.15)] hover:shadow-[0_0_25px_rgba(255,140,0,0.35)] border border-[#ff8c00]/30 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff8c00] via-[#ffa800] to-[#ff6b00] transition-opacity duration-300 group-hover/lab:opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/lab:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                        <span className="relative z-10 flex items-center gap-2">
                          <Search size={16} />
                          Qdrant Lab
                        </span>
                      </button>
                    </>
                  )}

                  {/* Disable delete while processing */}
                  <button
                    onClick={() => deleteRepo(repo._id)}
                    disabled={repo.status === "cloning" || repo.status === "indexing"}
                    className="cursor-pointer flex justify-center items-center w-10 h-10 bg-[#0a0a0a] hover:bg-[#ff4500] text-[#737373] hover:text-white border border-[#1a1a1a] hover:border-transparent rounded-xl transition-all duration-300 active:scale-90 shadow-sm group/btn ml-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0a0a0a] disabled:hover:text-[#737373]"
                    title="Nuke My Data"
                  >
                    <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
