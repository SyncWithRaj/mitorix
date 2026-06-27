import { Router } from "express";
import { getSemanticClones } from "../controllers/clone.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature } from "../middlewares/subscription.middleware.js";

const router = Router();

// Semantic Clone Detection — PRO only
router.get("/:repoId", protect, requireFeature("clones:detect"), getSemanticClones);

export default router;
