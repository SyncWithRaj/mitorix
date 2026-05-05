"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Activity, ShieldAlert, Layers, Box, Cpu, 
  Shield, CheckCircle2, AlertTriangle, XCircle,
  FileCode2, GitMerge
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function CodeFlowDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: repoId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/codeflow/analysis/${repoId}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          toast.error("Failed to load analysis data");
        }
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(axiosErr.response?.data?.message || "Failed to load analysis");
        } else {
            toast.error("Failed to load analysis");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [repoId]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin"></div>
          <p className="text-[#8b949e] font-medium animate-pulse">Running full-codebase analysis...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle size={48} className="text-[#da3633]" />
        <h2 className="text-xl font-bold text-white">Analysis Data Unavailable</h2>
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-[#58a6ff] hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { health, stats, securityIssues, patterns, duplicates, layerViolations, suggestions } = data as {
    health: unknown;
    stats: unknown;
    securityIssues: unknown[];
    patterns: unknown[];
    duplicates: unknown[];
    layerViolations: unknown[];
    suggestions: unknown[];
  };

  const getHealthColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'text-[#2ea043] border-[#2ea043]/30 bg-[#2ea043]/10 shadow-[0_0_20px_rgba(46,160,67,0.2)]';
      case 'B': return 'text-[#58a6ff] border-[#58a6ff]/30 bg-[#58a6ff]/10 shadow-[0_0_20px_rgba(88,166,255,0.2)]';
      case 'C': return 'text-[#d29922] border-[#d29922]/30 bg-[#d29922]/10 shadow-[0_0_20px_rgba(210,153,34,0.2)]';
      case 'D': return 'text-[#da3633] border-[#da3633]/30 bg-[#da3633]/10 shadow-[0_0_20px_rgba(218,54,51,0.2)]';
      default: return 'text-[#da3633] border-[#da3633]/30 bg-[#da3633]/10 shadow-[0_0_20px_rgba(218,54,51,0.3)]';
    }
  };



  return (
    <div className="max-w-7xl mt-20 mx-auto w-full py-8 px-6 flex-grow">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#30363d]/50 gap-4">
        <div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Repositories
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="text-[#a371f7]" size={28} />
            CodeFlow Intelligence
          </h1>
          <p className="text-[#8b949e] mt-2 text-sm">Deep structural and architectural analysis of your codebase.</p>
        </div>

        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${getHealthColor(health.grade)} transition-all duration-300`}>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Health Score</span>
            <span className="text-4xl font-bold">{health.score}/100</span>
          </div>
          <div className="h-12 w-px bg-current opacity-20 mx-2"></div>
          <div className="text-5xl font-black">{health.grade}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: <Box size={16} /> },
          { id: 'security', label: 'Security', icon: <ShieldAlert size={16} />, badge: securityIssues.length },
          { id: 'architecture', label: 'Architecture', icon: <Layers size={16} />, badge: layerViolations.length },
          { id: 'quality', label: 'Code Quality', icon: <FileCode2 size={16} />, badge: duplicates.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/50 shadow-[0_0_15px_rgba(31,111,235,0.15)]' 
                : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:bg-[#21262d] hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id ? 'bg-[#58a6ff] text-[#0d1117]' : 'bg-[#30363d] text-white'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Files Analyzed', val: stats.files, icon: <FileCode2 size={18} className="text-[#8b949e]" /> },
                { label: 'Functions', val: stats.functions, icon: <Cpu size={18} className="text-[#58a6ff]" /> },
                { label: 'Dependencies', val: stats.connections, icon: <GitMerge size={18} className="text-[#2ea043]" /> },
                { label: 'Lines of Code', val: stats.loc.toLocaleString(), icon: <Layers size={18} className="text-[#a371f7]" /> },
              ].map((s, i) => (
                <div key={i} className="glass-panel p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#8b949e] font-medium uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-white">{s.val}</p>
                  </div>
                  <div className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d]">{s.icon}</div>
                </div>
              ))}
            </div>

            {/* AI Suggestions */}
            <h2 className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
              <Cpu className="text-[#a371f7]" size={20} /> Actionable Intelligence
            </h2>
            
            {suggestions.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl text-center">
                <CheckCircle2 size={48} className="text-[#2ea043] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">Your codebase looks immaculate!</h3>
                <p className="text-[#8b949e] mt-2">We could not find any major architectural issues to report.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {suggestions.map((s: unknown, i: number) => (
                  <div key={i} className="glass-panel p-6 rounded-xl border-l-4 border-l-[#a371f7] group hover:bg-[#161b22] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {s.priority === 'critical' ? <XCircle className="text-[#da3633]" size={20} /> :
                         s.priority === 'high' ? <AlertTriangle className="text-[#d29922]" size={20} /> :
                         <Info className="text-[#58a6ff]" size={20} />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{s.title}</h3>
                        <p className="text-sm text-[#8b949e] mt-1.5 leading-relaxed">{s.desc}</p>
                        <div className="mt-4 flex flex-col gap-2 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                          <p className="text-xs text-white"><span className="text-[#58a6ff] font-semibold">Action:</span> {s.action}</p>
                          <p className="text-xs text-white"><span className="text-[#2ea043] font-semibold">Impact:</span> {s.impact}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeInUp">
            {securityIssues.length === 0 ? (
              <div className="glass-panel p-12 rounded-xl text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-[#2ea043]/10 border border-[#2ea043]/30 rounded-full flex items-center justify-center mb-6">
                  <Shield size={40} className="text-[#2ea043]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Security Vulnerabilities Detected</h3>
                <p className="text-[#8b949e] max-w-md">Our static analysis scanners did not detect any hardcoded secrets, injection risks, or dangerous execution patterns.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {securityIssues.map((issue: unknown, i: number) => (
                  <div key={i} className="glass-panel p-6 rounded-xl border-l-4 border-l-[#da3633]">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="text-[#da3633]" size={20} />
                        <h3 className="text-lg font-bold text-white">{issue.title}</h3>
                      </div>
                      <span className="px-3 py-1 bg-[#da3633]/10 text-[#da3633] text-xs font-bold rounded-full border border-[#da3633]/30 uppercase tracking-wider">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-[#c9d1d9] mt-3 text-sm">{issue.desc}</p>
                    <div className="mt-4 bg-[#0d1117] p-4 rounded-lg border border-[#30363d]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#8b949e] font-mono">{issue.file}{issue.line ? `:${issue.line}` : ''}</span>
                      </div>
                      {issue.code && (
                        <pre className="text-xs text-[#ff7b72] font-mono overflow-x-auto whitespace-pre-wrap">
                          <code>{issue.code}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARCHITECTURE TAB */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 animate-fadeInUp">
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-[#58a6ff]" size={20} /> Layer Violations
            </h2>
            <p className="text-[#8b949e] text-sm mb-6">Identifies instances where lower architectural layers (e.g., models, utils) improperly import from higher layers (e.g., controllers, UI).</p>

            {layerViolations.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl text-center">
                <CheckCircle2 size={40} className="text-[#2ea043] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">Clean Architecture Maintained</h3>
                <p className="text-[#8b949e] mt-2">No strict layer boundary violations detected.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {layerViolations.map((v: unknown, i: number) => (
                  <div key={i} className="glass-panel p-5 rounded-xl border border-[#d29922]/30 bg-[#d29922]/5">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="text-[#d29922]" size={18} />
                      <h4 className="text-white font-semibold">
                        <span className="text-[#ff7b72]">{v.fromLayer}</span> importing <span className="text-[#58a6ff]">{v.toLayer}</span>
                      </h4>
                    </div>
                    <div className="text-xs font-mono text-[#8b949e] bg-[#0d1117] p-3 rounded border border-[#30363d] space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white min-w-16">From:</span>
                        <span className="truncate">{v.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white min-w-16">To:</span>
                        <span className="truncate">{v.to}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#c9d1d9] mt-3">
                      <span className="font-semibold text-white">Suggestion:</span> {v.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-12 mb-4">
              <Box className="text-[#a371f7]" size={20} /> Design Patterns Detected
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {patterns.map((p: unknown, i: number) => (
                <div key={i} className={`glass-panel p-5 rounded-xl border-l-4 ${p.isAnti ? 'border-l-[#da3633]' : 'border-l-[#58a6ff]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-bold flex items-center gap-2">
                      {p.isAnti ? <AlertTriangle className="text-[#da3633]" size={16} /> : <CheckCircle2 className="text-[#58a6ff]" size={16} />}
                      {p.name}
                    </h4>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-[#0d1117] border border-[#30363d]">
                      {p.files.length} instances
                    </span>
                  </div>
                  <p className="text-sm text-[#8b949e] mb-4">{p.desc}</p>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {p.files.map((f: unknown, fi: number) => (
                      <div key={fi} className="text-xs font-mono text-[#c9d1d9] py-1 border-b border-[#30363d]/50 last:border-0 truncate">
                        {f.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* QUALITY TAB */}
        {activeTab === 'quality' && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Duplicates */}
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCode2 className="text-[#58a6ff]" size={20} /> Code Duplication
            </h2>
            
            {duplicates.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl text-center mb-10">
                <CheckCircle2 size={40} className="text-[#2ea043] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white">DRY Principle Maintained</h3>
                <p className="text-[#8b949e] mt-2">No significant code clones or duplicate functions detected.</p>
              </div>
            ) : (
              <div className="grid gap-4 mb-10">
                {duplicates.map((d: unknown, i: number) => (
                  <div key={i} className="glass-panel p-5 rounded-xl border border-[#d29922]/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-[#d29922]" size={18} />
                        <h4 className="text-white font-bold">{d.type === 'code' ? 'Similar Code Blocks' : 'Duplicate Function Name'}</h4>
                      </div>
                      <span className="text-xs font-bold text-[#d29922] bg-[#d29922]/10 px-2 py-1 rounded border border-[#d29922]/20">
                        {d.similarity}% Match
                      </span>
                    </div>
                    
                    <p className="text-sm text-[#8b949e] mb-4">
                      Found <span className="text-white font-semibold">{d.name}</span> across {d.count} locations. {d.suggestion}
                    </p>

                    <div className="bg-[#0d1117] rounded-lg border border-[#30363d] overflow-hidden">
                      <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                        Occurrences
                      </div>
                      <div className="p-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {d.files.map((f: unknown, fi: number) => (
                          <div key={fi} className="text-xs font-mono text-[#c9d1d9] py-1.5 px-2 hover:bg-[#21262d] rounded transition-colors flex justify-between">
                            <span className="truncate pr-4">{f.file}</span>
                            <span className="text-[#8b949e] shrink-0">Line {f.line || '?'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

// Ensure Info icon is available
function Info(props: unknown) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
