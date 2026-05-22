"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useEditor } from "@/context/EditorContext";
import { getLanguage } from "@/utils/getLanguage";

const FileTreeNode = ({ node, repoId, openFile, level = 0 }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === "folder";

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      openFile(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 16 + 20}px` }}
        className="flex items-center gap-2 py-1.5 pr-5 cursor-pointer text-[#c9d1d9] hover:bg-[#2a2d2e] hover:text-white transition group"
      >
        {/* Render Chevron for folders */}
        {isFolder && (
          <svg
            className={`w-3 h-3 text-[#8b949e] transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        {/* Adjust gap if file to align with folder text */}
        {!isFolder && <div className="w-3 h-3" />}

        {/* Render Icon */}
        {isFolder ? (
          <svg
            className="w-4 h-4 text-[#e3b341] flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-[#519aba] group-hover:text-[#58a6ff] flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        <span className="truncate text-[13px]" title={node.name}>
          {node.name}
        </span>
      </div>

      {/* Recursive Children */}
      {isFolder && isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map((child: any, i: number) => (
            <FileTreeNode
              key={i}
              node={child}
              repoId={repoId}
              openFile={openFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ repoId }: any) {
  const [files, setFiles] = useState<any[]>([]);
  const { setEditorState } = useEditor();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await api.get(`/files/tree/${repoId}`);
        setFiles(res.data.files);
      } catch (err) {
        console.error("Fetch files error:", err);
      }
    };
    fetchFiles();
  }, [repoId]);

  const openFile = async (path: string) => {
    try {
      const res = await api.get(`/files/content`, {
        params: { repoId, path },
      });
      setEditorState({
        filePath: path,
        content: res.data.content,
        language: getLanguage(path),
      });
    } catch (err) {
      console.error("Open file error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b]">
      <div className="p-3 border-b border-[#30363d] bg-[#18181b] sticky top-0 z-10 flex items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-wider uppercase text-[#8b949e]">Explorer</h3>
      </div>
      <div className="py-2 overflow-y-auto flex-grow flex flex-col disable-text-selection">
        {files.length === 0 ? (
          <div className="px-5 py-2 text-[#8b949e] italic text-xs">No files available</div>
        ) : (
          files.map((f, i) => (
            <FileTreeNode key={i} node={f} repoId={repoId} openFile={openFile} level={0} />
          ))
        )}
      </div>
    </div>
  );
}
