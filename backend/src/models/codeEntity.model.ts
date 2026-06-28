import mongoose from "mongoose";
import { Schema, type Document } from "mongoose";

export interface ICodeEntity extends Document {
  repoId: mongoose.Types.ObjectId;
  filePath: string;
  name: string;
  type:
    | "function"
    | "class"
    | "method"
    | "constructor"
    | "property"
    | "staticMethod"
    | "arrow"
    | "interface"
    | "typeAlias"
    | "enum"
    | "variable"
    | "import"
    | "export"
    | "route"
    | "css"
    | "html";
  language: string;
  parameters: string[];
  returnType: string;
  startLine: number;
  endLine: number;
  scopeDepth: number;
  parentName?: string | null;
  embeddingId?: string;
}

const codeEntitySchema = new Schema<ICodeEntity>(
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
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "function",
        "class",
        "method",
        "constructor",
        "property",
        "staticMethod",
        "arrow",
        "interface",
        "typeAlias",
        "enum",
        "variable",
        "import",
        "export",
        "route",
        "css",
        "html",
      ],
      required: true,
    },
    language: {
      type: String,
      default: "unknown",
      index: true,
    },
    parameters: {
      type: [String],
      default: [],
    },
    returnType: {
      type: String,
      default: "",
    },
    startLine: {
      type: Number,
      required: true,
    },
    endLine: {
      type: Number,
      required: true,
    },
    scopeDepth: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    parentName: {
      type: String,
      default: null,
      index: true,
    },
    embeddingId: {
      type: String,
    },
  },
  { timestamps: true }
);

codeEntitySchema.index({ repoId: 1, name: 1 });
codeEntitySchema.index({ repoId: 1, parentName: 1 });
codeEntitySchema.index({ repoId: 1, scopeDepth: 1 });
codeEntitySchema.index({ repoId: 1, filePath: 1 });

export const CodeEntity = mongoose.model<ICodeEntity>("CodeEntity", codeEntitySchema);
