import { Router } from "express";
import { VectorController } from "../controllers/vectorInit.controller.js";

const router = Router();

const controller = new VectorController();

router.post("/init", controller.initVector);

export default router;
