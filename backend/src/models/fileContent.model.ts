import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IFileContent extends Document {
  repoId: mongoose.Types.ObjectId;
  relativePath: string;
  fileName: string;
  isDirectory: boolean;
  content: string | null;
  /** Encoding of the content field: 'plain' (raw text) or 'gzip' (gzip + base64) */
  contentEncoding: "plain" | "gzip";
  fileSize: number;
}

const fileContentSchema = new Schema<IFileContent>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    relativePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: false, // Derivable from relativePath, kept for backward compat
    },
    isDirectory: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      default: null,
    },
    contentEncoding: {
      type: String,
      enum: ["plain", "gzip"],
      default: "plain",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
fileContentSchema.index({ repoId: 1, relativePath: 1 }, { unique: true });

export const FileContent = mongoose.model<IFileContent>("FileContent", fileContentSchema);
