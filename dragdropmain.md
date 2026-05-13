# RepoLens: Drag-and-Drop Implementation Plan (Revised)

> **Scope**: Implement universal drag-and-drop + rename Codeflow→RepoLens + merge dashboard buttons + slide-out ChatPanel in the intelligence page.

---

## Structural Changes (Pre-Phase)

### A. Rename "Codeflow" → "RepoLens" Everywhere

| File | Change |
|------|--------|
| `dashboard/page.tsx` L414 | `"CodeFlow Intelligence"` → `"RepoLens Intelligence"` |
| `dashboard/page.tsx` L407-432 | **Remove** the "Chat with Codebase" button entirely |
| `CodeflowLayout.tsx` L186 | `CF` badge → `RL` |
| `CodeflowLayout.tsx` L189 | `CODEFLOW` → `REPOLENS` |
| `CodeflowLayout.tsx` L133 | Toast: `"CodeFlow analysis"` → `"RepoLens analysis"` |
| `codeflow/[id]/page.tsx` | Keep route path as `/codeflow/` (no URL break) |

### B. Dashboard: Single Button

Remove "Chat with Codebase" button. The single `"RepoLens Intelligence"` button navigates to `/codeflow/:id`. Embedding happens on-demand (already implemented in `query.service.ts` L17-25).

### C. Add Slide-Out ChatPanel to CodeflowLayout Topbar

Add a chat toggle button to the topbar. Clicking slides the ChatPanel in from the right side as an overlay panel. The ChatPanel reuses the existing component from `components/chat/ChatPanel.tsx`.

**New state in `CodeflowLayout.tsx`:**
```typescript
const [chatOpen, setChatOpen] = useState(false);
```

**Topbar button (next to existing buttons):**
```tsx
<button onClick={() => setChatOpen(!chatOpen)} title="AI Chat">
  <MessageSquare size={16} />
  <span>AI Chat</span>
</button>
```

**Slide-out panel (inside the main layout, overlaying from right):**
```tsx
{chatOpen && (
  <div className="absolute right-0 top-0 bottom-0 w-[380px] z-50 
                  border-l border-gh-border bg-gh-bg shadow-2xl
                  animate-in slide-in-from-right duration-300">
    <ChatPanel repoId={repoId} ... />
  </div>
)}
```

The chat state (messages, input, loading, streaming) lives in `CodeflowLayout` and is passed down to `ChatPanel` — same pattern as `chat/[repoId]/page.tsx`.

---

## Phase 1: Types & Drag Store

### 1a. `frontend/lib/dragdrop.types.ts` (NEW)

Expanded `EntityType` covering ALL UI-draggable categories:

```typescript
export type EntityType =
  // Graph & File Tree nodes
  | 'FOLDER' | 'FILE' | 'FUNCTION' | 'CLASS' | 'INTERFACE'
  | 'METHOD' | 'ARROW' | 'VARIABLE' | 'IMPORT' | 'EXPORT'
  | 'ENUM' | 'TYPE_ALIAS' | 'ROUTE' | 'CONSTRUCTOR' | 'PROPERTY'
  // Right panel items
  | 'SECURITY_ISSUE' | 'ARCHITECTURE_ISSUE' | 'PATTERN'
  | 'SUGGESTION' | 'DUPLICATE' | 'CONNECTION';

export type DragSource = 'LEFT_PANEL' | 'FORCE_GRAPH' | 'RIGHT_PANEL' | 'GRAPH_VIEW';

export interface DraggedContextNode {
  id: string;           // MongoDB _id, file path, or synthetic ID
  type: EntityType;
  name: string;         // Display name
  path?: string;        // File path if applicable
  source: DragSource;
  metadata?: Record<string, any>;  // Extra context (severity, desc, code snippet, etc.)
}
```

> [!IMPORTANT]
> `metadata` allows right-panel items (security issues, patterns, suggestions) to carry their full context without needing a backend lookup — since these don't have MongoDB entity IDs or vector embeddings.

### 1b. `frontend/lib/dragStore.ts` (NEW)

```typescript
import { create } from 'zustand';
import type { DraggedContextNode } from './dragdrop.types';

interface DragState {
  isDragging: boolean;
  draggedItem: DraggedContextNode | null;
  startDrag: (item: DraggedContextNode) => void;
  stopDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  isDragging: false,
  draggedItem: null,
  startDrag: (item) => set({ isDragging: true, draggedItem: item }),
  stopDrag: () => set({ isDragging: false, draggedItem: null }),
}));
```

**Prerequisite**: `cd frontend && npm install zustand`

---

## Phase 2: Make All UI Elements Draggable

### 2a. Left Panel — `TreeExplorer.tsx`

Add `draggable` + `onDragStart` to folder rows and file rows:

```diff
+ import { useDragStore } from '@/lib/dragStore';

// In TreeNode, folder header div:
  <div
+   draggable
+   onDragStart={(e) => {
+     const payload = { id: node.path, type: 'FOLDER', name: node.name, path: node.path, source: 'LEFT_PANEL' };
+     e.dataTransfer.setData('application/repolens-node', JSON.stringify(payload));
+     useDragStore.getState().startDrag(payload);
+   }}
+   onDragEnd={() => useDragStore.getState().stopDrag()}
    onClick={() => togglePath(node.path)}
  >

// In TreeNode, file row div:
  <div
+   draggable
+   onDragStart={(e) => {
+     const payload = { id: file.path, type: 'FILE', name: file.name, path: file.path, source: 'LEFT_PANEL' };
+     e.dataTransfer.setData('application/repolens-node', JSON.stringify(payload));
+     useDragStore.getState().startDrag(payload);
+   }}
+   onDragEnd={() => useDragStore.getState().stopDrag()}
    onClick={() => onSelect(file.path)}
  >
```

### 2b. Right Panel — SecurityPanel, IssuesPanel, PatternsPanel, SuggestionsPanel

Each item card gets `draggable` with its relevant metadata:

**SecurityPanel.tsx** — each issue card:
```diff
  <div
    key={i}
+   draggable
+   onDragStart={(e) => {
+     const payload = {
+       id: `security-${i}`, type: 'SECURITY_ISSUE', name: issue.title,
+       path: issue.file, source: 'RIGHT_PANEL',
+       metadata: { severity: issue.severity, desc: issue.desc, code: issue.code }
+     };
+     e.dataTransfer.setData('application/repolens-node', JSON.stringify(payload));
+     useDragStore.getState().startDrag(payload);
+   }}
+   onDragEnd={() => useDragStore.getState().stopDrag()}
    className={`p-3 rounded-lg border cursor-pointer ...`}
  >
```

Same pattern for **IssuesPanel** (`ARCHITECTURE_ISSUE`), **PatternsPanel** (`PATTERN`), **SuggestionsPanel** (`SUGGESTION` / `DUPLICATE`).

### 2c. Graph Canvas — `GraphView.tsx`

Hook into `onNodeDrag` from `react-force-graph-2d`:

```diff
+ import { useDragStore } from '@/lib/dragStore';

  <ForceGraph2D
+   onNodeDrag={(node) => {
+     if (!useDragStore.getState().isDragging) {
+       const typeMap: Record<string, string> = {
+         folder: 'FOLDER', file: 'FILE', function: 'FUNCTION',
+         class: 'CLASS', interface: 'INTERFACE', method: 'METHOD',
+         arrow: 'ARROW', variable: 'VARIABLE', import: 'IMPORT', export: 'EXPORT',
+       };
+       useDragStore.getState().startDrag({
+         id: node.mongoId || node.id,
+         type: (typeMap[node.type] || 'FUNCTION') as any,
+         name: node.name, path: node.path || node.id, source: 'FORCE_GRAPH',
+       });
+     }
+   }}
+   onNodeDragEnd={() => useDragStore.getState().stopDrag()}
  />
```

---

## Phase 3: ChatPanel Drop Zone & Context Chips

### 3a. Chat State in `CodeflowLayout.tsx`

```typescript
const [chatMessages, setChatMessages] = useState<any[]>([]);
const [callMessages, setCallMessages] = useState<any[]>([]);
const [chatInput, setChatInput] = useState("");
const [chatLoading, setChatLoading] = useState(false);
const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
const [attachedNodes, setAttachedNodes] = useState<DraggedContextNode[]>([]);
```

The `sendMessage` function posts to `/query/ask` with `{ repoId, question, attachedNodes }` — same as the existing chat page but including attached context.

### 3b. ChatPanel Drop Zone

In the chat input area, add drop handlers:

```tsx
<div
  className={`glass-panel border ... ${isDragging ? 'border-[#58a6ff] ring-2 ring-[#58a6ff]/20' : ''}`}
  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
  onDrop={(e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/repolens-node');
    if (raw) {
      const node = JSON.parse(raw);
      setAttachedNodes(prev => prev.some(n => n.id === node.id) ? prev : [...prev, node]);
    }
    useDragStore.getState().stopDrag();
  }}
>
```

### 3c. Context Chips UI

Rendered above the textarea:

```tsx
{attachedNodes.length > 0 && (
  <div className="flex flex-wrap gap-1.5 px-3 pt-3 pb-1">
    {attachedNodes.map((node) => (
      <div key={node.id} className="inline-flex items-center gap-1.5 text-[11px] 
           bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-lg px-2.5 py-1.5 
           text-[#58a6ff] font-medium">
        <span>{getEntityIcon(node.type)}</span>
        <span className="font-mono truncate max-w-[120px]">{node.name}</span>
        <button onClick={() => removeNode(node.id)}>
          <X size={10} />
        </button>
      </div>
    ))}
  </div>
)}
```

Icon mapping: `FILE→📄 FOLDER→📁 FUNCTION→⚡ CLASS→🏗️ SECURITY_ISSUE→🛡️ ARCHITECTURE_ISSUE→⚠️ PATTERN→🧩 SUGGESTION→💡 DUPLICATE→📋`

---

## Phase 4: Backend — Context Injection

### Context Strategy by Entity Type

| Entity Type | Has Vector Embedding? | Backend Lookup |
|-------------|----------------------|----------------|
| FILE, FUNCTION, CLASS, etc. | ✅ Yes (already in Qdrant) | Fetch from `CodeEntity` by `_id` or `filePath` |
| FOLDER | ❌ No | Fetch all `CodeEntity` docs under that path |
| SECURITY_ISSUE | ❌ No | Use `metadata` from payload (no DB lookup needed) |
| ARCHITECTURE_ISSUE | ❌ No | Use `metadata` from payload |
| PATTERN, SUGGESTION, DUPLICATE | ❌ No | Use `metadata` from payload |

### 4a. `query.controller.ts` — Extract `attachedNodes`

```diff
- const { repoId, question } = req.body;
+ const { repoId, question, attachedNodes } = req.body;
  // ...
- const result = await askQuestion(repoId, question, historyMessages);
+ const result = await askQuestion(repoId, question, historyMessages, attachedNodes);
```

### 4b. `query.service.ts` — Build Explicit Context

```diff
- export const askQuestion = async (repoId, question, history = []) => {
+ export const askQuestion = async (repoId, question, history = [], attachedNodes = []) => {

  // After embedding check, before vector search:

+ // ── 1.5. Build explicit context from drag-dropped items ──
+ let explicitContextStr = "";
+ for (const node of attachedNodes) {
+   if (['FILE','FUNCTION','CLASS','METHOD','ARROW','INTERFACE','VARIABLE','IMPORT','EXPORT',
+        'ENUM','TYPE_ALIAS','ROUTE','CONSTRUCTOR','PROPERTY'].includes(node.type)) {
+     // Has embeddings — fetch from CodeEntity
+     if (mongoose.Types.ObjectId.isValid(node.id)) {
+       const entity = await CodeEntity.findById(node.id);
+       if (entity) {
+         const rel = path.relative(repo.localPath, entity.filePath).replace(/\\/g, "/");
+         explicitContextStr += `\n[ATTACHED: ${node.type}] ${entity.name}\nFile: ${rel}\nLines: ${entity.startLine}-${entity.endLine}\n\n${entity.content}\n`;
+       }
+     } else {
+       // File path lookup (from TreeExplorer)
+       const fullPath = path.join(repo.localPath, node.id);
+       const entities = await CodeEntity.find({ repoId, filePath: fullPath }).limit(20);
+       for (const e of entities) {
+         const rel = path.relative(repo.localPath, e.filePath).replace(/\\/g, "/");
+         explicitContextStr += `\n[ATTACHED: ${e.type}] ${e.name}\nFile: ${rel}\nLines: ${e.startLine}-${e.endLine}\n\n${e.content}\n`;
+       }
+     }
+   } else {
+     // Right-panel items — use metadata directly (no DB lookup)
+     explicitContextStr += `\n[ATTACHED: ${node.type}] ${node.name}\n`;
+     if (node.path) explicitContextStr += `File: ${node.path}\n`;
+     if (node.metadata) {
+       for (const [k, v] of Object.entries(node.metadata)) {
+         explicitContextStr += `${k}: ${v}\n`;
+       }
+     }
+     explicitContextStr += "\n";
+   }
+ }

  // Then prepend to AST context:
- let astContextStr = "";
+ let astContextStr = explicitContextStr;
```

### 4c. System Prompt Update

Add to rules:
```
- Items marked [ATTACHED: ...] were explicitly drag-and-dropped by the user. Prioritize these above all other context when answering.
```

### Context Priority

```
1. EXPLICIT (drag-dropped) — highest priority
2. VECTOR SEARCH (Qdrant) — semantic expansion  
3. CONVERSATION HISTORY — dialogue continuity
4. USER QUERY — the question
```

---

## Phase 5: UI Action Dispatching

Extend the existing `<blast_radius>` tag parsing to also handle `<ui_action>` tags. The LLM system prompt instructs it to emit these when the user asks to visualize relationships. Clicking the rendered button navigates to the graph with the correct target — same as the existing blast radius button pattern.

---

## Files Summary

| Phase | File | Action |
|-------|------|--------|
| Pre | `dashboard/page.tsx` | MODIFY (rename, remove button) |
| Pre | `CodeflowLayout.tsx` | MODIFY (rename, add chat toggle + slide-out) |
| 1 | `frontend/lib/dragdrop.types.ts` | CREATE |
| 1 | `frontend/lib/dragStore.ts` | CREATE |
| 2 | `codeflow/sidebar/TreeExplorer.tsx` | MODIFY (draggable) |
| 2 | `codeflow/panels/SecurityPanel.tsx` | MODIFY (draggable) |
| 2 | `codeflow/panels/IssuesPanel.tsx` | MODIFY (draggable) |
| 2 | `codeflow/panels/PatternsPanel.tsx` | MODIFY (draggable) |
| 2 | `codeflow/panels/SuggestionsPanel.tsx` | MODIFY (draggable) |
| 2 | `graph/GraphView.tsx` | MODIFY (onNodeDrag) |
| 3 | `chat/ChatPanel.tsx` | MODIFY (drop zone, chips) |
| 4 | `backend/controllers/query.controller.ts` | MODIFY |
| 4 | `backend/services/query.service.ts` | MODIFY |
| 5 | `backend/services/query.service.ts` | MODIFY (prompt) |




you ar senior fullstack developer and architechture with a good knowledge of Applied AI adn techstack needed in project so for node embedding first ceck the logic if the current logic is perfectly satisfied then only go ahead otherwise make the logic as needed for full implementation make sure that no any issue create when user drag drop nodes from any view of visualization and left and right panels take care of every aspect that user can do and implement the ull implementation plan in projectand take care of my comments and make sure you take care of every aspect to work these features done