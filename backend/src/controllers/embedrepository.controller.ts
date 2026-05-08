import type { Request, Response } from "express";
import { embedRepository } from "../services/embedRepository.service.js";

export const embedRepositoryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "repoId required",
      });
    }

    const result = await embedRepository(id);

    return res.json({
      success: true,
      message: "Repository embedded successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "embedding Failed",
      error: error.message || error.toString(),
    });
  }
};
