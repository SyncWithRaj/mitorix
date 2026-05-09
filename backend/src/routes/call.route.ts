import { Router } from "express";
import { processCall, streamTTS } from "../controllers/call.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate } from "../lib/validate.js";
import { processCallSchema } from "../schemas/call.schema.js";

const router = Router();

router.post("/process", protect, llmRateLimiter, validate(processCallSchema), processCall);
router.get("/tts", protect, llmRateLimiter, streamTTS);

export default router;
