/**
 * Semantic Code Search — Controller
 *
 * REST endpoint handler for semantic code search powered by Qdrant.
 * No LLM involved — pure vector similarity search.
 */

import type { Request, Response, NextFunction } from "express";
import { semanticSearch } from "../services/semanticSearch.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import { requireString } from "../utils/repositoryAccess.util.js";

/**
 * GET /api/v1/search/:repoId
 * Semantic code search within a repository.
 *
 * Query params:
 *  - q: search query (required)
 *  - type: entity type filter (optional, e.g., "function", "class")
 *  - language: language filter (optional, e.g., "typescript")
 *  - folder: folder path filter (optional, e.g., "src/services")
 *  - limit: max results (optional, default 20, max 50)
 */
export const searchCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = req.user as Express.IUser | undefined;
    if (!user) throw new AppError("Unauthorized", 401);

    const repoId = requireString(req.params.repoId, "Repository ID");
    const query = requireString(req.query.q, "Search query (q)");

    const entityType = (req.query.type as string) || undefined;
    const language = (req.query.language as string) || undefined;
    const folder = (req.query.folder as string) || undefined;
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const result = await semanticSearch(
      repoId,
      user._id.toString(),
      query,
      { entityType, language, folder },
      limit
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
