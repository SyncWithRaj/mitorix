// ── Universal Drag-and-Drop Type Definitions ──
// Every draggable item in the UI serializes into a DraggedContextNode.

export type EntityType =
  // Graph & File Tree nodes (have vector embeddings in Qdrant)
  | "FOLDER"
  | "FILE"
  | "FUNCTION"
  | "CLASS"
  | "INTERFACE"
  | "METHOD"
  | "ARROW"
  | "VARIABLE"
  | "IMPORT"
  | "EXPORT"
  | "ENUM"
  | "TYPE_ALIAS"
  | "ROUTE"
  | "CONSTRUCTOR"
  | "PROPERTY"
  | "STATIC_METHOD"
  // Right panel items (carry context via metadata — no vector embeddings)
  | "SECURITY_ISSUE"
  | "ARCHITECTURE_ISSUE"
  | "PATTERN"
  | "SUGGESTION"
  | "DUPLICATE";

export type DragSource =
  | "LEFT_PANEL"
  | "FORCE_GRAPH"
  | "GRAPH_VIEW"
  | "RIGHT_PANEL";

export interface DraggedContextNode {
  id: string; // MongoDB _id, file path, graph node id, or synthetic id
  type: EntityType;
  name: string; // Display name (e.g., "authenticateUser()")
  path?: string; // File path when applicable
  source: DragSource;
  // Extra context for right-panel items that don't have vector embeddings.
  // (severity, description, code snippet, etc.)
  metadata?: Record<string, any>;
}

// Maps a CodeEntity type string to our EntityType union
const _typeMapBase = new Map<string, EntityType>([
  ["folder", "FOLDER"],
  ["file", "FILE"],
  ["function", "FUNCTION"],
  ["class", "CLASS"],
  ["interface", "INTERFACE"],
  ["method", "METHOD"],
  ["arrow", "ARROW"],
  ["variable", "VARIABLE"],
  ["import", "IMPORT"],
  ["export", "EXPORT"],
  ["enum", "ENUM"],
  ["typeAlias", "TYPE_ALIAS"],
  ["route", "ROUTE"],
  ["constructor", "CONSTRUCTOR"],
  ["property", "PROPERTY"],
  ["staticMethod", "STATIC_METHOD"],
]);

export function getEntityType(typeStr: string): EntityType {
  return _typeMapBase.get(typeStr) || "FILE";
}

// Emoji icon for each entity type used in context chips
export const entityIcons: Record<EntityType, string> = {
  FOLDER: "📁",
  FILE: "📄",
  FUNCTION: "⚡",
  CLASS: "🏗️",
  INTERFACE: "🔷",
  METHOD: "⚙️",
  ARROW: "➜",
  VARIABLE: "📌",
  IMPORT: "📥",
  EXPORT: "📤",
  ENUM: "🔢",
  TYPE_ALIAS: "🏷️",
  ROUTE: "🌐",
  CONSTRUCTOR: "🔨",
  PROPERTY: "🔑",
  STATIC_METHOD: "⚙️",
  SECURITY_ISSUE: "🛡️",
  ARCHITECTURE_ISSUE: "⚠️",
  PATTERN: "🧩",
  SUGGESTION: "💡",
  DUPLICATE: "📋",
};
