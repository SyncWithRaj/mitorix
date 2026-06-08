import { Router } from "express";
import { getVersions, compareDrift } from "../controllers/drift.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:repoId/versions", protect, getVersions);
router.get("/:repoId/compare", protect, compareDrift);

export default router;
