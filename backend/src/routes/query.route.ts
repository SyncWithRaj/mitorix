import { Router } from "express";
import { ask } from "../controllers/query.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { llmRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate } from "../lib/validate.js";
import { querySchema } from "../schemas/query.schema.js";

const router = Router();

router.post("/ask", protect, llmRateLimiter, validate(querySchema), ask);

export default router;
