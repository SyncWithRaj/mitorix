import { Router } from "express";
import { getSemanticClones } from "../controllers/clone.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:repoId", protect, getSemanticClones);

export default router;
