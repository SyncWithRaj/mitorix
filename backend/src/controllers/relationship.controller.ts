import type { Request, Response, NextFunction } from "express";

import { RepoParsedData } from "../models/repoParsedData.model.js";
import { expandRelationships } from "../utils/repoParsedData.helpers.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";
import logger from "../lib/logger.js";

export async function getRepositoryoRelations(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const { from, to, type, file } = req.query;

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const parsedData = await RepoParsedData.findOne({ repoId }).lean();
    let relations = parsedData ? expandRelationships(parsedData as any) : [];

    // Apply filters in JS (replaces MongoDB query filters)
    if (from) relations = relations.filter((r) => r.fromName === from);
    if (to) relations = relations.filter((r) => r.toName === to);
    if (type) relations = relations.filter((r) => r.relationType === type);
    if (file) relations = relations.filter((r) => r.fromFilePath === file);

    // Sort by line number (same as old .sort({ line: 1 }))
    relations.sort((a, b) => a.line - b.line);

    return res.status(200).json({
      success: true,
      total: relations.length,
      data: relations,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch repository relations");
    next(error);
  }
}
