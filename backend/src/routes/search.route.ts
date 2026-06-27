import { Router } from "express";
import { searchCode } from "../controllers/search.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature, tierRateLimit } from "../middlewares/subscription.middleware.js";

const router = Router();

// Semantic Search — FREE+ with tier-based daily limit
router.get(
  "/:repoId",
  protect,
  requireFeature("search:semantic"),
  tierRateLimit("searchPerDay"),
  searchCode
);

export default router;
