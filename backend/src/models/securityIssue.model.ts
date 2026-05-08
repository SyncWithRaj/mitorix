import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface ISecurityIssue extends Document {
  repoId: mongoose.Types.ObjectId;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  file: string;
  path: string;
  line?: number;
  desc: string;
  code?: string;
  createdAt: Date;
  updatedAt: Date;
}

const securityIssueSchema = new Schema<ISecurityIssue>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    line: {
      type: Number,
    },
    desc: {
      type: String,
      required: true,
    },
    code: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

securityIssueSchema.index({ repoId: 1, severity: 1 });

export const SecurityIssue = mongoose.model<ISecurityIssue>("SecurityIssue", securityIssueSchema);
