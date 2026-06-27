import { Router } from "express";
import { getVersions, compareDrift } from "../controllers/drift.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature } from "../middlewares/subscription.middleware.js";

const router = Router();

// Drift Detection — PRO only
router.get("/:repoId/versions", protect, requireFeature("drift:detect"), getVersions);
router.get("/:repoId/compare", protect, requireFeature("drift:detect"), compareDrift);

export default router;
