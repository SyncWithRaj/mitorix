import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Repository } from "../models/repo.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";

export async function getRepositoryEntities(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { type, page = "1", limit = "500" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "InValid repo id",
      });
    }

    const repo = await Repository.findById(id);
    if (!repo) {
      return res.status(404).json({
        success: false,
        message: "Repo not found",
      });
    }

    const query: any = { repoId: id };

    if (type) {
      query.type = type;
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [entities, total] = await Promise.all([
      CodeEntity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean(),
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
