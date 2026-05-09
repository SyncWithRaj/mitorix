import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { CodeRelationship } from "../models/relationship.model.js";
import { Repository } from "../models/repo.model.js";
import logger from "../lib/logger.js";

export async function getRepositoryoRelations(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { from, to, type, file } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository id",
      });
    }

    // Optional: ensure repo exists
    const repoExists = await Repository.exists({ _id: id });
    if (!repoExists) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    const filter: any = { repoId: id };

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
