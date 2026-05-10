import mongoose from "mongoose";
import { Schema, type Document } from "mongoose";

export interface ICodeRelationship extends Document {
  repoId: mongoose.Types.ObjectId;
  fromName: string;
  fromFilePath: string;
  toName: string;
  toFilePath: string | null;
  relationType: "calls" | "accesses" | "imports" | "handles";
  line: number;
  count: number;
  isExternal: boolean;
}

const relationshipSchema = new Schema<ICodeRelationship>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    fromName: {
      type: String,
      required: true,
      index: true,
    },
    fromFilePath: {
      type: String,
      required: true,
    },
    toName: {
      type: String,
      required: true,
      index: true,
    },
    toFilePath: {
      type: String,
      default: null,
    },
    relationType: {
      type: String,
      enum: ["calls", "accesses", "imports", "handles"],
      required: true,
      index: true,
    },
    line: {
      type: Number,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

relationshipSchema.index({ repoId: 1, fromName: 1 });
relationshipSchema.index({ repoId: 1, toName: 1 });

export const CodeRelationship = mongoose.model<ICodeRelationship>(
  "CodeRelationship",
  relationshipSchema
);
