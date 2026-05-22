import type { Request, Response, NextFunction } from "express";

import { FileMetadata } from "../models/fileMetadata.model.js";
import logger from "../lib/logger.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

export async function getRepoFilesController(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const files = await FileMetadata.find({ repoId }).sort({ filePath: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch repository files");

    next(error);
  }
}
