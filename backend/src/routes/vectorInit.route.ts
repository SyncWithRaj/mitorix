import { Router } from "express";
import { VectorController } from "../controllers/vectorInit.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new VectorController();

router.post("/init", protect, controller.initVector);

export default router;
