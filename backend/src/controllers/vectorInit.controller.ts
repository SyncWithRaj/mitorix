import type { Request, Response } from "express";
import { VectorInitService } from "../services/vectorInit.service.js";

export class VectorController {
  private vectorService = new VectorInitService();

  initVector = async (req: Request, res: Response) => {
    try {
      const result = await this.vectorService.initVectorCollection();

      res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Vector collection initialization failed",
        error: error.message || error.toString(),
      });
    }
  };
}
