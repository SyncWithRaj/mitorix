import type { NextFunction, Request, Response } from "express";
import { CodeEntity } from "../models/codeEntity.model.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

export async function getRepositoryEntities(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const { type, page = "1", limit = "500" } = req.query;

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const query: any = { repoId };

    if (type) {
      query.type = type;
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [entities, total] = await Promise.all([
      CodeEntity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean(),
      CodeEntity.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: entities,
    });
  } catch (error) {
    next(error);
  }
}
