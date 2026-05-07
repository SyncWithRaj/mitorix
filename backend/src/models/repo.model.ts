import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IRepository extends Document {
    user: mongoose.Types.ObjectId;
    name: string;
    githubUrl: string;
    defaultBranch: string;
    localPath: string;
    status: "cloning" | "cloned" | "indexing" | "indexed" | "failed";
    jobId?: string;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
    onboardingGuide?: any;
    systemDesignDoc?: string;
    isSession?: boolean;
}

const repoSchema = new Schema<IRepository>({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    githubUrl: {
        type: String,
        required: true,
    },
    defaultBranch: {
        type: String,
        default: "main",
    },
    localPath: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["cloning", "cloned", "indexing", "indexed", "failed"],
        default: "cloning",
    },
    jobId: {
        type: String,
    },
    commitHash: {
        type: String,
    },
    fingerprint: {
        type: String,
        index: true,
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now,
        index: true, // Useful for the cleanup query
    },
    onboardingGuide: {
        type: Schema.Types.Mixed,
    },
    systemDesignDoc: {
        type: String,
    },
    isSession: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

export const Repository = mongoose.model<IRepository>("Repository", repoSchema);