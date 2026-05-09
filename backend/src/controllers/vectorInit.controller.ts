import type { Request, Response } from "express";
import { VectorInitService } from "../services/vectorInit.service.js";
import logger from "../lib/logger.js";

export class VectorController {
  private vectorService = new VectorInitService();

  initVector = async (req: Request, res: Response) => {
    try {
      const result = await this.vectorService.initVectorCollection();

      res.status(200).json(result);
    } catch (error: any) {
      logger.error({ err: error }, "Vector collection initialization failed");
      res.status(500).json({
        message: "Vector collection initialization failed",
        error: error.message || error.toString(),
      });
    }
  };
}
