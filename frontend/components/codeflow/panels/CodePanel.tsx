"use client";

import React, { useEffect, useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import Editor from "@monaco-editor/react";
import api from "../../../lib/axios";
import { Loader2, AlertCircle } from "lucide-react";

export default function CodePanel({ repoId }: { repoId: string }) {
  const { selectedFile } = useCodeflow();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile || !repoId) return;

    const fetchCode = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/files/content`, {
          params: { repoId, path: selectedFile }
        });
        setCode(res.data.content);
      } catch (err: any) {
        console.error("Failed to fetch file content", err);
        setError(err.response?.data?.message || err.message || "Failed to load file source code.");
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [selectedFile, repoId]);

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#8b949e] p-6 text-center">
        <p className="text-sm">Select a file from the graph to view its source code.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#8b949e]">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-xs">Loading source code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#f85149] p-6 text-center">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Determine language based on file extension
  let language = "javascript";
  if (selectedFile.endsWith(".ts") || selectedFile.endsWith(".tsx")) language = "typescript";
  else if (selectedFile.endsWith(".py")) language = "python";
  else if (selectedFile.endsWith(".go")) language = "go";
  else if (selectedFile.endsWith(".java")) language = "java";
  else if (selectedFile.endsWith(".cpp") || selectedFile.endsWith(".h")) language = "cpp";
  else if (selectedFile.endsWith(".json")) language = "json";
  else if (selectedFile.endsWith(".md")) language = "markdown";

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <span className="text-xs font-mono text-[#58a6ff] truncate">
          {selectedFile.split('/').pop()}
        </span>
      </div>
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code || "// No content"}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}
