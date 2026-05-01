"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Box, Loader2, Play, Trash2, Github, MessageSquare, Plus, Info } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

function RepoProgressTracker({ jobId, onComplete }: { jobId: string, onComplete: () => void }) {
    const [status, setStatus] = useState("connecting...");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
        const eventSource = new EventSource(
            `${baseUrl}/repos/jobs/${jobId}/status`,
            { withCredentials: true }
        );

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
            <div className="flex justify-between text-xs text-[#8b949e] font-mono font-medium tracking-wide">
                <span>{status.toUpperCase()}</span>
                <span className="text-[#58a6ff]">{progress}%</span>
            </div>
            <div className="w-full bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]/80 shadow-inner">
                <div
                    className="bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] h-2 rounded-full transition-all duration-500 ease-out relative"
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
    const [embeddingRepo, setEmbeddingRepo] = useState<string | null>(null);

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
            toast.error(err.response?.data?.message || "Failed to start analysis. Check the URL and try again.");
        }
        setLoading(false);
    };

    const embedRepo = async (repoId: string) => {
        try {
            setEmbeddingRepo(repoId);
            toast.loading("Preparing AI agent for chat...");
            await api.post("/vector/init");
            await api.post(`/embed/${repoId}`);
            toast.success("AI agent ready! Redirecting to chat...");
            router.push(`/chat/${repoId}`);
        } catch (err) {
            console.error("Embed repo error:", err);
            toast.error("Failed to prepare AI agent. Try again.");
        } finally {
            setEmbeddingRepo(null);
        }
    };

    const deleteRepo = async (repoId: string) => {
        const confirmDelete = confirm("NUCLEAR OPTION: Are you sure you want to nuke this repository? This will instantly and irreversibly delete all your code data, vectors, and chat history.");
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

    return (
        <div className="max-w-6xl mt-20 mx-auto w-full py-12 px-6 flex-grow">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#30363d]/50">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Box className="text-[#58a6ff]" size={28} />
                        Repositories
                    </h1>
                    <p className="text-[#8b949e] mt-2 text-sm font-medium">Manage and chat with indexed GitHub repositories in your isolated workspace.</p>
                </div>
            </div>

            <div className="mb-8 p-8 bg-gradient-to-br from-[rgba(22,27,34,0.6)] to-[rgba(13,17,23,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }}></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#2ea043]/10 to-transparent blur-3xl rounded-full pointer-events-none group-hover:from-[#2ea043]/20 transition-all duration-700 animate-glow-pulse"></div>
                
                <h2 className="text-lg font-semibold text-white mb-4 relative z-10 flex items-center gap-2">
                    <Plus size={18} className="text-[#2ea043]" />
                    Index a new repository
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    <div className="relative flex-grow">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Github className="h-5 w-5 text-[#8b949e]" />
                       </div>
                       <input
                           type="url"
                           placeholder="https://github.com/owner/repo"
                           value={githubUrl}
                           onChange={(e) => setGithubUrl(e.target.value)}
                           className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#010409]/80 backdrop-blur-sm border border-[#30363d] text-white focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all shadow-inner placeholder-[#484f58]"
                       />
                    </div>
                    <button
                        onClick={processRepo}
                        disabled={loading || !githubUrl}
                        className="group/btn relative cursor-pointer text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] border border-[rgba(255,255,255,0.1)] whitespace-nowrap shadow-[0_0_20px_rgba(35,134,54,0.3)] hover:shadow-[0_0_30px_rgba(46,160,67,0.5)] flex items-center justify-center min-w-[180px] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#238636] to-[#2ea043] transition-opacity duration-300 group-hover/btn:opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                        <span className="relative z-10 flex items-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Codebase"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Language Support Banner */}
            <div className="mb-8 p-4 bg-gradient-to-r from-[#161b22] via-[#1c2333] to-[#161b22] border border-[#30363d]/60 rounded-xl relative overflow-hidden animate-fadeIn">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#58a6ff]/5 to-transparent animate-shimmer pointer-events-none"></div>
                <div className="flex items-start gap-3 relative z-10">
                    <div className="flex-shrink-0 mt-0.5">
                        <Info size={18} className="text-[#58a6ff]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#c9d1d9] font-medium">
                            <span className="text-[#58a6ff] font-semibold">Currently supporting:</span>{" "}
                            JavaScript, TypeScript, HTML, and CSS repositories.
                        </p>
                        <p className="text-xs text-[#8b949e] mt-1">
                            More languages and frameworks will be supported in future updates. Stay tuned! 🚀
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {repos.length === 0 ? (
                    <div className="text-center py-24 px-4 bg-[#0d1117]/50 border-2 border-dashed border-[#30363d]/50 rounded-3xl flex flex-col items-center animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-6 shadow-inner">
                           <GitBranch className="h-8 w-8 text-[#8b949e]" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
                        <p className="text-sm text-[#8b949e] max-w-sm">Get started by pasting a public GitHub repository URL above to clone and index it.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {repos.map((repo, index) => (
                          <div
                              key={repo._id}
                              className="group glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-6 hover:bg-[rgba(22,27,34,0.6)] transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(88,166,255,0.1)] hover:border-[rgba(88,166,255,0.3)] hover:-translate-y-1 relative overflow-hidden animate-fadeInUp"
                              style={{ animationDelay: `${index * 60}ms` }}
                          >
                              {/* Hover glow line */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#58a6ff] to-[#a371f7] opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(88,166,255,0.8)]"></div>
                              
                              <div className="flex items-center flex-grow flex-wrap md:flex-nowrap">
                                  <div className="flex items-start gap-4">
                                      <div className="w-10 h-10 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shadow-inner group-hover:border-[#58a6ff]/30 transition-colors shrink-0">
                                         <GitBranch className="w-5 h-5 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors" />
                                      </div>
                                      <div>
                                          <h3 className="text-xl font-bold text-white group-hover:text-[#58a6ff] transition-colors cursor-pointer flex items-center gap-2">
                                              {repo.name}
                                          </h3>
                                          <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e] font-mono">
                                              <span className="flex items-center gap-2 font-medium bg-[#161b22] px-2.5 py-1 rounded-md border border-[#30363d]">
                                                  <span className={`w-2 h-2 rounded-full ${
                                                      repo.status === "failed" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" :
                                                      repo.status === "cloning" || repo.status === "indexing" ? "bg-[#e3b341] animate-pulse shadow-[0_0_8px_rgba(227,179,65,0.6)]" :
                                                      repo.status === "indexed" ? "bg-[#2ea043] shadow-[0_0_8px_rgba(46,160,67,0.6)]" : "bg-blue-400"
                                                  }`}></span>
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
                                              onClick={() => router.push(`/graph/${repo._id}`)}
                                              className="cursor-pointer flex items-center gap-2 text-sm bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
                                          >
                                              <Box size={16} />
                                              Visualize Network
                                          </button>
                                          <button
                                              onClick={() => embedRepo(repo._id)}
                                              disabled={embeddingRepo === repo._id}
                                              className="group/chat cursor-pointer relative flex items-center gap-2 text-sm text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shadow-[0_0_15px_rgba(88,166,255,0.2)] hover:shadow-[0_0_20px_rgba(88,166,255,0.5)] border border-[rgba(255,255,255,0.1)] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                              <div className="absolute inset-0 bg-gradient-to-r from-[#58a6ff] to-[#1f6feb] transition-opacity duration-300 group-hover/chat:opacity-90"></div>
                                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/chat:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                                              <span className="relative z-10 flex items-center gap-2">
                                                {embeddingRepo === repo._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare size={16} />}
                                                {embeddingRepo === repo._id ? "Preparing Agent..." : "Chat with Codebase"}
                                              </span>
                                          </button>
                                      </>
                                  )}

                                  {/* Disable delete while processing */}
                                  <button
                                      onClick={() => deleteRepo(repo._id)}
                                      disabled={repo.status === "cloning" || repo.status === "indexing"}
                                      className="cursor-pointer flex justify-center items-center w-10 h-10 bg-[#21262d] hover:bg-[#da3633] text-[#8b949e] hover:text-white border border-[#30363d] hover:border-transparent rounded-xl transition-all duration-300 active:scale-90 shadow-sm group/btn ml-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#21262d] disabled:hover:text-[#8b949e]"
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