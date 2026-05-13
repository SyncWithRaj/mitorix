import { create } from "zustand";
import type { DraggedContextNode } from "./dragdrop.types";

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
