/**
 * CodeFlow — Routes
 *
 * Route definitions for all CodeFlow analysis endpoints.
 * SBAC: analyze/health/security/patterns available from FREE,
 *       blast/suggestions/pr gated to higher tiers.
 */

import { Router } from "express";
import {
  analyzeRepository,
  getAnalysis,
  getHealthScore,
  getSecurityFindings,
  getPatterns,
  getBlastRadius,
  getSuggestions,
  getPRAnalysis,
} from "../controllers/codeflow.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireFeature } from "../middlewares/subscription.middleware.js";
import { validate } from "../lib/validate.js";
import { analyzeRepositorySchema, getPRAnalysisSchema } from "../schemas/codeflow.schema.js";

const router = Router();

// All CodeFlow routes are protected
router.use(protect);

// Trigger full analysis (FREE+)
router.post("/analyze", requireFeature("codeflow:analyze"), validate(analyzeRepositorySchema), analyzeRepository);

// Get full analysis results (FREE+)
router.get("/analysis/:repoId", requireFeature("codeflow:analyze"), getAnalysis);

// Get health score (FREE+)
router.get("/health/:repoId", requireFeature("codeflow:health"), getHealthScore);

// Get security findings (FREE+)
router.get("/security/:repoId", requireFeature("codeflow:security"), getSecurityFindings);

// Get detected patterns (FREE+)
router.get("/patterns/:repoId", requireFeature("codeflow:patterns"), getPatterns);

// Get blast radius for a file (BASIC+)
router.get("/blast/:repoId/*filePath", requireFeature("codeflow:blast"), getBlastRadius);

// Get suggestions (BASIC+)
router.get("/suggestions/:repoId", requireFeature("codeflow:suggestions"), getSuggestions);

// Get PR Analysis files (PRO only)
router.get("/pr/:repoId/:prNumber", requireFeature("codeflow:pr"), validate(getPRAnalysisSchema), getPRAnalysis);

export default router;
