/**
 * RepoParsedData Helpers
 *
 * Provides backward-compatible accessor functions that expand the consolidated
 * RepoParsedData document back into the shape that existing consumers expect
 * (i.e., the old CodeEntity, CodeRelationship, and FileMetadata shapes).
 *
 * This lets us change storage without rewriting every consumer at once.
 */

import type {
  IRepoParsedData,
  IParsedEntity,
  IParsedRelationship,
  IParsedFileMetadata,
} from "../models/repoParsedData.model.js";

// ── Expanded Types (match the old model shapes) ─────────────────────────────

export interface ExpandedEntity {
  _id?: any;
  repoId: any;
  name: string;
  type: string;
  filePath: string;
  language: string;
  parameters: string[];
  returnType: string;
  startLine: number;
  endLine: number;
  scopeDepth: number;
  parentName?: string | null;
  embeddingId?: string;
  /** Original index in the entities array (for Qdrant payload reference) */
  entityIndex: number;
}

export interface ExpandedRelationship {
  repoId: any;
  fromName: string;
  fromFilePath: string;
  toName: string;
  toFilePath: string | null;
  relationType: string;
  line: number;
  count: number;
  isExternal: boolean;
}

export interface ExpandedFileMetadata {
  repoId: any;
  filePath: string;
  fileName: string;
  language: string;
  fileSize: number;
  totalLines: number;
  hasDefaultExport: boolean;
  hasReactComponent: boolean;
  isBackendFile: boolean;
  isTestFile: boolean;
}

// ── Path Helper ─────────────────────────────────────────────────────────────

function basename(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx === -1 ? filePath : filePath.substring(idx + 1);
}

// ── Expand Functions ────────────────────────────────────────────────────────

/**
 * Expand entities from the consolidated doc back to the shape old code expects.
 * Each expanded entity includes `filePath` resolved from the filePaths lookup
 * table and an `entityIndex` for Qdrant payload reference.
 */
export function expandEntities(doc: IRepoParsedData): ExpandedEntity[] {
  if (!doc || !doc.entities) return [];

  const { filePaths, repoId, entities } = doc;

  return entities.map((e: any, index: number) => ({
    _id: e._id, // Sub-document _id (exists because _id: true on entity schema)
    repoId,
    name: e.name,
    type: e.type,
    filePath: filePaths[e.fileIdx] || "",
    language: e.language || "unknown",
    parameters: e.parameters || [],
    returnType: e.returnType || "",
    startLine: e.startLine,
    endLine: e.endLine,
    scopeDepth: e.scopeDepth ?? 0,
    parentName: e.parentName ?? null,
    embeddingId: e.embeddingId,
    entityIndex: index,
  }));
}

/**
 * Expand relationships from the consolidated doc back to the old shape.
 * Resolves fileIdx references into actual file path strings.
 */
export function expandRelationships(doc: IRepoParsedData): ExpandedRelationship[] {
  if (!doc || !doc.relationships) return [];

  const { filePaths, repoId } = doc;

  return doc.relationships.map((r) => ({
    repoId,
    fromName: r.fromName,
    fromFilePath: filePaths[r.fromFileIdx] || "",
    toName: r.toName,
    toFilePath: r.toFileIdx >= 0 ? (filePaths[r.toFileIdx] || null) : null,
    relationType: r.relationType,
    line: r.line,
    count: r.count || 1,
    isExternal: r.isExternal || false,
  }));
}

/**
 * Expand file metadata from the consolidated doc back to the old shape.
 * Derives `fileName` from the file path (no longer stored).
 */
export function expandFileMetadata(doc: IRepoParsedData): ExpandedFileMetadata[] {
  if (!doc || !doc.fileMetadata) return [];

  const { filePaths, repoId } = doc;

  return doc.fileMetadata.map((fm) => {
    const filePath = filePaths[fm.fileIdx] || "";
    return {
      repoId,
      filePath,
      fileName: basename(filePath),
      language: fm.language || "unknown",
      fileSize: fm.fileSize,
      totalLines: fm.totalLines,
      hasDefaultExport: fm.hasDefaultExport || false,
      hasReactComponent: fm.hasReactComponent || false,
      isBackendFile: fm.isBackendFile || false,
      isTestFile: fm.isTestFile || false,
    };
  });
}

// ── Query Helpers ───────────────────────────────────────────────────────────

interface EntityQuery {
  name?: string;
  filePath?: string;
  type?: string;
}

/**
 * Find entities within a RepoParsedData doc that match the given query.
 * This replaces `CodeEntity.find({ repoId, name, filePath })` for in-memory filtering.
 */
export function findEntitiesInDoc(
  doc: IRepoParsedData,
  query: EntityQuery
): ExpandedEntity[] {
  if (!doc || !doc.entities) return [];

  const { filePaths } = doc;
  const expanded = expandEntities(doc);

  return expanded.filter((e) => {
    if (query.name && e.name !== query.name) return false;
    if (query.filePath && e.filePath !== query.filePath) return false;
    if (query.type && e.type !== query.type) return false;
    return true;
  });
}

/**
 * Find a single entity by its sub-document _id.
 * Used for Qdrant → MongoDB lookups during migration period.
 */
export function findEntityById(
  doc: IRepoParsedData,
  entityId: string
): ExpandedEntity | null {
  if (!doc || !doc.entities) return null;

  const expanded = expandEntities(doc);
  return expanded.find((e) => e._id?.toString() === entityId) || null;
}

/**
 * Find entities by an array of sub-document _ids.
 * Replaces `CodeEntity.find({ _id: { $in: mongoIds } })`.
 */
export function findEntitiesByIds(
  doc: IRepoParsedData,
  entityIds: string[]
): ExpandedEntity[] {
  if (!doc || !doc.entities || entityIds.length === 0) return [];

  const idSet = new Set(entityIds);
  const expanded = expandEntities(doc);
  return expanded.filter((e) => e._id && idSet.has(e._id.toString()));
}

/**
 * Build a file path index map for fast fileIdx lookups.
 * Used during data ingestion (write path) to convert file paths to indices.
 */
export function buildFilePathIndex(filePaths: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < filePaths.length; i++) {
    map.set(filePaths[i]!, i);
  }
  return map;
}

/**
 * Get or add a file path to the index, returning the index.
 */
export function getOrAddFilePath(
  filePaths: string[],
  filePathIndex: Map<string, number>,
  filePath: string
): number {
  let idx = filePathIndex.get(filePath);
  if (idx === undefined) {
    idx = filePaths.length;
    filePaths.push(filePath);
    filePathIndex.set(filePath, idx);
  }
  return idx;
}
