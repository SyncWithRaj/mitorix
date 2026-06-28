"use client";

import React, { useState } from "react";
import { useCodeflow } from "../../../context/CodeflowContext";
import { File, Folder, ChevronRight, ChevronDown, Filter, X } from "lucide-react";
import { FolderTree } from "../../../lib/codeflow.types";
import { useDragStore } from "../../../lib/dragStore";
import type { DraggedContextNode } from "../../../lib/dragdrop.types";

interface TreeNodeProps {
  node: FolderTree;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  expandedPaths: Record<string, boolean>;
  togglePath: (path: string) => void;
  folderFilter: string | null;
  setFolderFilter: (path: string | null) => void;
}

const TreeNode = ({
  node,
  selectedFile,
  onSelect,
  expandedPaths,
  togglePath,
  folderFilter,
  setFolderFilter,
}: TreeNodeProps) => {
  if (!node) return null;

  const isExpanded = expandedPaths[node.path];
  const isFiltered = folderFilter === node.path || folderFilter?.startsWith(node.path + "/");

  return (
    <div className="flex flex-col">
      {/* Folder Header */}
      {node.path !== "" && (
        <div
          className="flex items-center gap-1.5 py-1 px-1 rounded-md cursor-pointer transition-colors text-xs text-[#e5e5e5] hover:bg-[#1a1a1a] group"
          onClick={(e) => {
            e.stopPropagation();
            togglePath(node.path);
          }}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            const payload: DraggedContextNode = {
              id: node.path,
              type: "FOLDER",
              name: node.name,
              path: node.path,
              source: "LEFT_PANEL",
            };
            e.dataTransfer.setData("application/mitorix-node", JSON.stringify(payload));
            e.dataTransfer.effectAllowed = "copy";
            useDragStore.getState().startDrag(payload);
          }}
          onDragEnd={() => useDragStore.getState().stopDrag()}
        >
          <span className="shrink-0 w-4 h-4 flex items-center justify-center text-[#737373]">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Folder size={14} className="shrink-0 text-[#ff8c00]" />
          <span className="truncate flex-1">{node.name}</span>

          {/* Filter Button */}
          <button
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              isFiltered
                ? "opacity-100 text-[#ff6b00] bg-[#ff6b00]/10"
                : "text-[#737373] hover:text-white hover:bg-[#1a1a1a]"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setFolderFilter(folderFilter === node.path ? null : node.path);
            }}
            title={isFiltered ? "Clear filter" : "Filter to this folder"}
          >
            <Filter size={12} />
          </button>
        </div>
      )}

      {/* Children Folders and Files */}
      {isExpanded && (
        <div
          className={`${node.path !== "" ? "ml-3 pl-2 border-l border-[#1a1a1a]" : ""} flex flex-col mt-0.5`}
        >
          {/* Render subfolders */}
          {node.children &&
            Object.values(node.children).map((childFolder) => (
              <TreeNode
                key={childFolder.path}
                node={childFolder}
                selectedFile={selectedFile}
                onSelect={onSelect}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
                folderFilter={folderFilter}
                setFolderFilter={setFolderFilter}
              />
            ))}

          {/* Render files */}
          {node.files &&
            node.files.map((file) => {
              const isSelected = selectedFile === file.path;
              return (
                <div
                  key={file.path}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? "bg-[#ff6b00]/10 text-[#ff6b00]"
                      : "text-[#e5e5e5] hover:bg-[#1a1a1a] hover:text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(file.path);
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    const payload: DraggedContextNode = {
                      id: file.path,
                      type: "FILE",
                      name: file.name,
                      path: file.path,
                      source: "LEFT_PANEL",
                    };
                    e.dataTransfer.setData("application/mitorix-node", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "copy";
                    useDragStore.getState().startDrag(payload);
                  }}
                  onDragEnd={() => useDragStore.getState().stopDrag()}
                >
                  <File size={14} className="shrink-0 opacity-70 text-[#ff6b00]/60" />
                  <span className="truncate">{file.name}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default function TreeExplorer() {
  const { analysisData, selectedFile, selectFile, folderFilter, setFolderFilter, filteredTree } =
    useCodeflow();

  // Track expanded folder paths
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    "": true, // Auto-expand root (path is usually empty string or "root")
  });

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  if (!analysisData || !filteredTree) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1a1a1a]">
        <div className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">
          Explorer
        </div>
        {folderFilter && (
          <button
            onClick={() => setFolderFilter(null)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#ff6b00] bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 rounded transition-colors"
          >
            <X size={10} /> Clear Filter
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <TreeNode
          node={filteredTree as FolderTree}
          selectedFile={selectedFile}
          onSelect={selectFile}
          expandedPaths={expandedPaths}
          togglePath={togglePath}
          folderFilter={folderFilter}
          setFolderFilter={setFolderFilter}
        />
      </div>
    </div>
  );
}
