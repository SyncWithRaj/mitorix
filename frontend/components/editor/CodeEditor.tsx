"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import { FileCode2, X } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function CodeEditor() {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const { editorState, tabs, activeTabId, setActiveTabId, closeTab } = useEditor();

  const handleMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // 🧠 ensure model exists
    const model = editor.getModel();
    if (!model) return;

    // Smooth scroll and highlight (only if valid line number)
    if (editorState?.startLine) {
      setTimeout(() => {
        // ScrollType.Smooth = 0
        editor.revealLineInCenter(editorState.startLine, 0);

        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: {
                startLineNumber: editorState.startLine,
                startColumn: 1,
                endLineNumber:
                  editorState.endLine || editorState.startLine,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: "highlight-line",
              },
            },
          ]
        );
      }, 150);
    }
  }, [editorState]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d1117] rounded-xl overflow-hidden relative border-none">
      
      {/* Absolute Glow Background just for aesthetic padding */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-l from-[#a371f7]/5 to-transparent blur-3xl pointer-events-none -z-10"></div>

      {/* VSCode-style Tab Bar */}
      <div className="flex bg-[#010409] border-b border-[#30363d] overflow-x-auto min-h-[46px] items-end custom-scrollbar px-1 pt-1.5 relative z-10 w-full">
        {tabs && tabs.length > 0 ? (
          tabs.map((tab: any) => (
            <div 
              key={tab.filePath}
              onClick={() => setActiveTabId(tab.filePath)}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] min-w-max cursor-pointer border-t-2 border-x border-[#30363d] rounded-t-lg transition-all group select-none ml-1
                ${activeTabId === tab.filePath 
                  ? "bg-[#0d1117] border-t-[#58a6ff] border-x-[#30363d] text-[#c9d1d9] border-b-transparent shadow-[0_-2px_10px_rgba(88,166,255,0.05)] z-20 scale-y-105 origin-bottom translate-y-[1px]" 
                  : "bg-[#161b22] border-t-transparent border-x-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]"
                }`}
            >
              <FileCode2 size={16} className={activeTabId === tab.filePath ? "text-[#58a6ff]" : "text-[#8b949e] group-hover:text-[#c9d1d9]"} />
              <span className="truncate max-w-[200px] font-mono">{tab.filePath.split('/').pop()}</span>
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   closeTab(e, tab.filePath);
                }}
                className={`ml-2 flex items-center justify-center p-0.5 hover:bg-[#30363d] rounded transition ${activeTabId === tab.filePath ? "opacity-100 text-[#8b949e] hover:text-[#c9d1d9]" : "opacity-0 group-hover:opacity-100 text-[#8b949e]"}`}
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="px-5 py-2.5 text-sm text-[#8b949e] italic pb-2 flex items-center gap-2 font-light">
             No files open in workspace
          </div>
        )}

        {/* This fills the bottom gap for inactive tabs perfectly */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#30363d] z-0 pointer-events-none"></div>
      </div>

      <div className="flex-grow relative bg-[#0d1117] z-10">
        <MonacoEditor
          key={editorState?.filePath} // Force remount on file change
          height="100%"
          language={editorState?.language || "javascript"}
          value={editorState?.content || ""}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            padding: { top: 24, bottom: 24 },
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            scrollbar: {
              vertical: 'visible',
              useShadows: true,
              alwaysConsumeMouseWheel: false,
            },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            lineHeight: 1.6,
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}