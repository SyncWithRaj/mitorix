import type { Request, Response, NextFunction } from "express";

import { CodeRelationship } from "../models/relationship.model.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";
import logger from "../lib/logger.js";

export async function getRepositoryoRelations(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const { from, to, type, file } = req.query;

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const filter: any = { repoId };

    if (from) filter.fromName = from;
    if (to) filter.toName = to;
    if (type) filter.relationType = type;
    if (file) filter.fromFilePath = file;

    const relations = await CodeRelationship.find(filter).sort({ line: 1 }).lean();

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
