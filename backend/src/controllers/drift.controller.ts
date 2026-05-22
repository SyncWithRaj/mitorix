/**
 * Codebase Drift Detection — Controller
 */

import type { Request, Response, NextFunction } from "express";
import {
  computeDrift,
  getVersionFingerprints,
} from "../services/drift.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import { requireString } from "../utils/repositoryAccess.util.js";

/**
 * GET /api/v1/drift/:repoId/versions
 * Get available version fingerprints + cross-repo comparison targets.
 */
export const getVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = req.user as Express.IUser | undefined;
    if (!user) throw new AppError("Unauthorized", 401);

    const repoId = requireString(req.params.repoId, "Repository ID");
    const result = await getVersionFingerprints(repoId, user._id.toString());

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/drift/:repoId/compare
 * Compare two versions of a repository for semantic drift.
 *
 * Query params:
 *  - old: old fingerprint (required)
 *  - new: new fingerprint (required)
 *  - compareRepoId: optional, compare against a different repo
 */
export const compareDrift = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = req.user as Express.IUser | undefined;
    if (!user) throw new AppError("Unauthorized", 401);

    const repoId = requireString(req.params.repoId, "Repository ID");
    const oldFingerprint = (req.query.old as string) || "";
    const newFingerprint = (req.query.new as string) || "";
    const compareRepoId = (req.query.compareRepoId as string) || undefined;

    const result = await computeDrift(
      repoId,
      user._id.toString(),
      oldFingerprint,
      newFingerprint,
      compareRepoId
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
