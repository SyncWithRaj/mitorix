"use client";

import { createContext, useContext, useState } from "react";

export interface EditorTab {
  filePath: string;
  content: string;
  language: string;
  startLine?: number;
  endLine?: number;
}

const EditorContext = createContext<any>(null);

export const EditorProvider = ({ children }: any) => {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (tab: EditorTab) => {
    setTabs((prev) => {
      const exists = prev.find((t) => t.filePath === tab.filePath);
      if (!exists) {
        return [...prev, tab];
      }
      return prev.map((t) => (t.filePath === tab.filePath ? { ...t, ...tab } : t));
    });
    setActiveTabId(tab.filePath);
  };

  const closeTab = (e?: React.MouseEvent, filePath?: string) => {
    if (e) e.stopPropagation();
    if (!filePath) return;

    setTabs((prev) => {
      const filtered = prev.filter((t) => t.filePath !== filePath);
      if (activeTabId === filePath) {
        setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].filePath : null);
      }
      return filtered;
    });
  };

  // Backwards compatible setter
  const setEditorState = (state: EditorTab | null) => {
    if (!state) {
      setActiveTabId(null);
      return;
    }
    openTab(state);
  };

  // Backwards compatible getter
  const editorState = tabs.find((t) => t.filePath === activeTabId) || null;

  return (
    <EditorContext.Provider
      value={{ tabs, activeTabId, setActiveTabId, closeTab, setEditorState, editorState }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
