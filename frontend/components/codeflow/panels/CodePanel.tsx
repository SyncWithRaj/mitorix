"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import Editor from "@monaco-editor/react";
import api from "../../../lib/axios";
import { Loader2, AlertCircle, X } from "lucide-react";

type FileCache = Record<string, string>;

type MinimalEditor = {
  deltaDecorations: (oldDecorations: string[], newDecorations: unknown[]) => string[];
  revealLineInCenter: (lineNumber: number, scrollType?: number) => void;
};

const getLanguageForFile = (filePath: string) => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".py")) return "python";
  if (filePath.endsWith(".go")) return "go";
  if (filePath.endsWith(".java")) return "java";
  if (filePath.endsWith(".cpp") || filePath.endsWith(".h")) return "cpp";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".md")) return "markdown";
  return "javascript";
};

export default function CodePanel({ repoId }: { repoId: string }) {
  const {
    selectedFile,
    setSelectedFile,
    codeHighlightRange,
    codeOpenTabs,
    setCodeOpenTabs,
    setCodeHighlightRange,
  } = useCodeflow();

  const [fileCache, setFileCache] = useState<FileCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<MinimalEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const activeCode = useMemo(() => {
    if (!selectedFile) return null;
    return fileCache[selectedFile] || null;
  }, [fileCache, selectedFile]);

  const openTab = (filePath: string) => {
    setCodeOpenTabs((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));
    setSelectedFile(filePath);
  };

  const closeTab = (filePath: string) => {
    setCodeOpenTabs((prev) => prev.filter((p) => p !== filePath));

    if (selectedFile === filePath) {
      const remaining = codeOpenTabs.filter((p) => p !== filePath);
      const next = remaining[remaining.length - 1] || null;
      setSelectedFile(next);
      setCodeHighlightRange(null);
    }
  };

  useEffect(() => {
    if (!selectedFile || !repoId) return;

    if (!codeOpenTabs.includes(selectedFile)) {
      setCodeOpenTabs((prev) => (prev.includes(selectedFile) ? prev : [...prev, selectedFile]));
    }

    if (fileCache[selectedFile] !== undefined) return;

    const fetchCode = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/files/content`, {
          params: { repoId, path: selectedFile },
        });

        setFileCache((prev) => ({
          ...prev,
          [selectedFile]: res.data.content,
        }));
      } catch (err: unknown) {
        console.error("Failed to fetch file content", err);
        const message =
          typeof err === "object" && err !== null && "message" in err
            ? String((err as { message?: string }).message || "")
            : "";
        setError(message || "Failed to load file source code.");
      } finally {
        setLoading(false);
      }
    };

    fetchCode();
  }, [selectedFile, repoId, fileCache, codeOpenTabs, setCodeOpenTabs]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!codeHighlightRange) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const startLine = Math.max(1, codeHighlightRange.startLine || 1);
    const endLine = Math.max(startLine, codeHighlightRange.endLine || startLine);

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: {
          startLineNumber: startLine,
          startColumn: 1,
          endLineNumber: endLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "highlight-line",
        },
      },
    ]);

    editor.revealLineInCenter(startLine, 0);
  }, [codeHighlightRange, activeCode, selectedFile]);

  if (!selectedFile && codeOpenTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#737373] p-6 text-center">
        <p className="text-sm">
          Select a file from the graph or chat references to view source code.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      <div className="flex bg-[#050505] border-b border-[#1a1a1a] overflow-x-auto min-h-[38px] items-end custom-scrollbar px-1 py-1">
        {codeOpenTabs.map((tabPath) => {
          const active = tabPath === selectedFile;
          return (
            <button
              key={tabPath}
              onClick={() => {
                openTab(tabPath);
                setCodeHighlightRange(null);
              }}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-t-md border border-b-0 mr-1 transition ${
                active
                  ? "bg-[#000000] text-[#e5e5e5] border-[#1a1a1a] border-t-2 border-t-[#ff6b00]"
                  : "bg-[#0a0a0a] text-[#737373] border-transparent hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
              }`}
              title={tabPath}
            >
              <span className="font-mono max-w-[140px] truncate">{tabPath.split("/").pop()}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabPath);
                }}
                className="p-0.5 rounded hover:bg-[#1a1a1a]"
              >
                <X size={12} />
              </span>
            </button>
          );
        })}
      </div>

      {!selectedFile ? (
        <div className="flex flex-col items-center justify-center h-full text-[#737373] p-6 text-center">
          <p className="text-sm">No active tab selected.</p>
        </div>
      ) : loading && !activeCode ? (
        <div className="flex flex-col items-center justify-center h-full text-[#737373]">
          <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#ff6b00]" />
          <p className="text-xs">Loading source code...</p>
        </div>
      ) : error && !activeCode ? (
        <div className="flex flex-col items-center justify-center h-full text-[#ff4500] p-6 text-center">
          <AlertCircle className="w-8 h-8 mb-2 opacity-50 text-[#ff4500]" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative">
          <Editor
            key={selectedFile}
            height="100%"
            language={getLanguageForFile(selectedFile)}
            theme="vs-dark"
            value={activeCode || "// No content"}
            onMount={(editor) => {
              editorRef.current = editor as unknown as MinimalEditor;
            }}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              wordWrap: "on",
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      )}
    </div>
  );
}
