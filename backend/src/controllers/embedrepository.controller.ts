import type { Request, Response, NextFunction } from "express";
import { embedRepository } from "../services/embedRepository.service.js";
import logger from "../lib/logger.js";
import { getOwnedRepositoryOrThrow } from "../utils/repositoryAccess.util.js";

export const embedRepositoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Verify ownership and existence before proceeding
    const repo = await getOwnedRepositoryOrThrow(id, req.user);

    const result = await embedRepository(repo._id.toString());

    return res.json({
      success: true,
      message: "Repository embedded successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};
