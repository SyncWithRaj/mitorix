import { Router } from "express";
import { ask } from "../controllers/query.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/ask", protect, llmRateLimiter, ask);

export default router;
