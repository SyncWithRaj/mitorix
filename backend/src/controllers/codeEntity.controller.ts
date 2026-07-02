import type { NextFunction, Request, Response } from "express";
import { RepoParsedData } from "../models/repoParsedData.model.js";
import { expandEntities } from "../utils/repoParsedData.helpers.js";
import { getOwnedRepositoryOrThrow, ensureValidRepoId } from "../utils/repositoryAccess.util.js";

export async function getRepositoryEntities(req: Request, res: Response, next: NextFunction) {
  try {
    const repoId = ensureValidRepoId(req.params.id);
    const { type, page = "1", limit = "500" } = req.query;

    await getOwnedRepositoryOrThrow(repoId, req.user);

    const parsedData = await RepoParsedData.findOne({ repoId }).lean();
    let entities = parsedData ? expandEntities(parsedData as any) : [];

    // Apply type filter
    if (type) {
      entities = entities.filter((e) => e.type === type);
    }

    const total = entities.length;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Sort by entityIndex (creation order) descending and paginate
    const paginatedEntities = entities.slice(skip, skip + limitNumber);

    return res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: paginatedEntities,
    });
  } catch (error) {
    next(error);
  }
}
