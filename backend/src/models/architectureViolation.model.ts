import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IArchitectureViolation extends Document {
    repoId: mongoose.Types.ObjectId;
    severity: "high" | "medium";
    file: string;
    path: string;
    importedFile: string;
    importedPath: string;
    violatingLayer: string;
    importedLayer: string;
    desc: string;
    line?: number;
    createdAt: Date;
    updatedAt: Date;
}

const architectureViolationSchema = new Schema<IArchitectureViolation>({
    repoId: {
        type: Schema.Types.ObjectId,
        ref: "Repository",
        required: true,
    },
    severity: {
        type: String,
        enum: ["high", "medium"],
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
    importedFile: {
        type: String,
        required: true,
    },
    importedPath: {
        type: String,
        required: true,
    },
    violatingLayer: {
        type: String,
        required: true,
    },
    importedLayer: {
        type: String,
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    line: {
        type: Number,
    }
}, {
    timestamps: true,
});

architectureViolationSchema.index({ repoId: 1 });

export const ArchitectureViolation = mongoose.model<IArchitectureViolation>("ArchitectureViolation", architectureViolationSchema);
