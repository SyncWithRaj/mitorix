import mongoose from "mongoose";
import { Schema, type Document } from "mongoose";

// ── Embedded Sub-Document Interfaces ────────────────────────────────────────

export interface IParsedEntity {
  name: string;
  type: string;
  fileIdx: number; // Index into filePaths[]
  language: string;
  parameters: string[];
  returnType: string;
  startLine: number;
  endLine: number;
  scopeDepth: number;
  parentName?: string | null;
  embeddingId?: string;
}

export interface IParsedRelationship {
  fromName: string;
  fromFileIdx: number; // Index into filePaths[]
  toName: string;
  toFileIdx: number; // -1 if null/external
  relationType: string;
  line: number;
  count: number;
  isExternal: boolean;
}

export interface IParsedFileMetadata {
  fileIdx: number; // Index into filePaths[]
  language: string;
  fileSize: number;
  totalLines: number;
  hasDefaultExport: boolean;
  hasReactComponent: boolean;
  isBackendFile: boolean;
  isTestFile: boolean;
}

// ── Main Document Interface ─────────────────────────────────────────────────

export interface IRepoParsedData extends Document {
  repoId: mongoose.Types.ObjectId;
  filePaths: string[];
  entities: IParsedEntity[];
  relationships: IParsedRelationship[];
  fileMetadata: IParsedFileMetadata[];
}

// ── Schema Definitions ──────────────────────────────────────────────────────

const parsedEntitySchema = new Schema<IParsedEntity>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "function", "class", "method", "constructor", "property",
        "staticMethod", "arrow", "interface", "typeAlias", "enum",
        "variable", "import", "export", "route", "css", "html",
      ],
      required: true,
    },
    fileIdx: { type: Number, required: true },
    language: { type: String, default: "unknown" },
    parameters: { type: [String], default: [] },
    returnType: { type: String, default: "" },
    startLine: { type: Number, required: true },
    endLine: { type: Number, required: true },
    scopeDepth: { type: Number, required: true, default: 0 },
    parentName: { type: String, default: null },
    embeddingId: { type: String },
  },
  { _id: true } // Keep _id for Qdrant backward compat during migration
);

const parsedRelationshipSchema = new Schema<IParsedRelationship>(
  {
    fromName: { type: String, required: true },
    fromFileIdx: { type: Number, required: true },
    toName: { type: String, required: true },
    toFileIdx: { type: Number, default: -1 },
    relationType: {
      type: String,
      enum: ["calls", "accesses", "imports", "handles"],
      required: true,
    },
    line: { type: Number, required: true },
    count: { type: Number, default: 1 },
    isExternal: { type: Boolean, default: false },
  },
  { _id: false }
);

const parsedFileMetadataSchema = new Schema<IParsedFileMetadata>(
  {
    fileIdx: { type: Number, required: true },
    language: { type: String, default: "unknown" },
    fileSize: { type: Number, required: true },
    totalLines: { type: Number, required: true },
    hasDefaultExport: { type: Boolean, default: false },
    hasReactComponent: { type: Boolean, default: false },
    isBackendFile: { type: Boolean, default: false },
    isTestFile: { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Main Schema ─────────────────────────────────────────────────────────────

const repoParsedDataSchema = new Schema<IRepoParsedData>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      unique: true,
    },
    filePaths: {
      type: [String],
      default: [],
    },
    entities: {
      type: [parsedEntitySchema],
      default: [],
    },
    relationships: {
      type: [parsedRelationshipSchema],
      default: [],
    },
    fileMetadata: {
      type: [parsedFileMetadataSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Single index — that's all we need
repoParsedDataSchema.index({ repoId: 1 }, { unique: true });

export const RepoParsedData = mongoose.model<IRepoParsedData>(
  "RepoParsedData",
  repoParsedDataSchema
);
