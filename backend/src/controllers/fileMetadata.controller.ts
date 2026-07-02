import type { Request, Response, NextFunction } from "express";

import { RepoParsedData } from "../models/repoParsedData.model.js";
import { expandFileMetadata } from "../utils/repoParsedData.helpers.js";
import logger from "../lib/logger.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

export async function getRepoFilesController(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const parsedData = await RepoParsedData.findOne({ repoId }).lean();
    const files = parsedData ? expandFileMetadata(parsedData as any) : [];

    // Sort by filePath (same as old .sort({ filePath: 1 }))
    files.sort((a, b) => a.filePath.localeCompare(b.filePath));

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
