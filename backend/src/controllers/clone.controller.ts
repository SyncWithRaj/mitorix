/**
 * Semantic Clone Detection — Controller
 *
 * REST endpoint handler for detecting semantic code clones using Qdrant.
 */

import type { Request, Response, NextFunction } from "express";
import { detectSemanticClones } from "../services/semanticClone.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import { requireString } from "../utils/repositoryAccess.util.js";

/**
 * GET /api/v1/clones/:repoId
 * Detect semantic code clones within a repository.
 *
 * Query params:
 *  - threshold: similarity threshold 0-1 (optional, default 0.85)
 *  - limit: max clusters to return (optional, default 30)
 */
export const getSemanticClones = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = req.user as Express.IUser | undefined;
    if (!user) throw new AppError("Unauthorized", 401);

    const repoId = requireString(req.params.repoId, "Repository ID");
    const threshold = Math.max(0.5, Math.min(1, Number(req.query.threshold) || 0.85));
    const limit = Math.min(Number(req.query.limit) || 30, 50);

    const result = await detectSemanticClones(
      repoId,
      user._id.toString(),
      threshold,
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
