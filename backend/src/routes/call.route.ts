import { Router } from "express";
import { processCall, streamTTS } from "../controllers/call.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature } from "../middlewares/subscription.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate } from "../lib/validate.js";
import { processCallSchema } from "../schemas/call.schema.js";

const router = Router();

// Voice Call — PRO only (uses AssemblyAI STT + Murf TTS = expensive)
router.post(
  "/process",
  protect,
  requireFeature("chat:voice"),
  llmRateLimiter,
  validate(processCallSchema),
  processCall
);

router.get(
  "/tts",
  protect,
  requireFeature("chat:voice"),
  llmRateLimiter,
  streamTTS
);

export default router;
