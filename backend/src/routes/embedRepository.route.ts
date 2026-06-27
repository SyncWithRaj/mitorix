import { Router } from "express";
import { embedRepositoryController } from "../controllers/embedrepository.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature } from "../middlewares/subscription.middleware.js";
import { validate } from "../lib/validate.js";
import { embedRepositorySchema } from "../schemas/embed.schema.js";

const router = Router();

// Embed repository — all tiers (needed for AI chat which is FREE+)
router.post("/:id", protect, requireFeature("repo:embed"), validate(embedRepositorySchema), embedRepositoryController);

export default router;
