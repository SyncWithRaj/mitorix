import mongoose from "mongoose";
import { Schema, type Document } from "mongoose";

export interface IFileMetadata extends Document {
  repoId: mongoose.Types.ObjectId;
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

const fileMetadataSchema = new Schema<IFileMetadata>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "unknown",
      index: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },

    totalLines: {
      type: Number,
      required: true,
    },

    hasDefaultExport: {
      type: Boolean,
      default: false,
    },

    hasReactComponent: {
      type: Boolean,
      default: false,
    },

    isBackendFile: {
      type: Boolean,
      default: false,
    },

    isTestFile: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

fileMetadataSchema.index({ repoId: 1, filePath: 1 });

export const FileMetadata = mongoose.model<IFileMetadata>("FileMetadata", fileMetadataSchema);
