import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IFileContent extends Document {
  repoId: mongoose.Types.ObjectId;
  relativePath: string;
  fileName: string;
  isDirectory: boolean;
  content: string | null;
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
      required: true,
    },
    isDirectory: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      default: null,
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
