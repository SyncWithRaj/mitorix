import { Router } from "express";
import { ask } from "../controllers/query.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature, tierRateLimit } from "../middlewares/subscription.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate } from "../lib/validate.js";
import { querySchema } from "../schemas/query.schema.js";

const router = Router();

// AI Chat — gated by feature + tier-based daily limit + global LLM rate limit
router.post(
  "/ask",
  protect,
  requireFeature("chat:ask"),
  tierRateLimit("chatPerDay"),
  llmRateLimiter,
  validate(querySchema),
  ask
);

export default router;
