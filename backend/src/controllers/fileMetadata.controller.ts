import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { FileMetadata } from "../models/fileMetadata.model.js";

export async function getRepoFilesController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository id",
      });
    }

    const files = await FileMetadata.find({ repoId: id }).sort({ filePath: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("Get Repo Files Error:", error);

    next(error);
  }
}
