import { GraphConfig } from "./codeflow.types";

export const COLORS = [
  "#4d9fff", // Blue
  "#a855f7", // Purple
  "#00ff9d", // Green
  "#ff9f43", // Orange
  "#ff5f5f", // Red
  "#22d3ee", // Cyan
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
  "#0ea5e9", // Sky
  "#10b981", // Emerald
];

export const LAYER_COLORS: Record<string, string> = {
  controller: "#ff5f5f", // Red - Edge
  service: "#ff9f43", // Orange - Logic
  model: "#00ff9d", // Green - Data
  view: "#4d9fff", // Blue - UI
  util: "#a855f7", // Purple - Shared
  test: "#ec4899", // Pink - Tests
  config: "#8b5cf6", // Violet - Setup
  unknown: "#55556a", // Gray - Uncategorized
};

export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  vizType: "force",
  viewMode: "force",
  curvedLinks: false,
  showLabels: true,
  linkDist: 60,
  spacing: 200,
};
