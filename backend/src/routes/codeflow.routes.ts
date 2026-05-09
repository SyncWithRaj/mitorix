/**
 * CodeFlow — Routes
 *
 * Route definitions for all CodeFlow analysis endpoints.
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
import { validate } from "../lib/validate.js";
import { analyzeRepositorySchema, getPRAnalysisSchema } from "../schemas/codeflow.schema.js";

const router = Router();

// All CodeFlow routes are protected
router.use(protect);

// Trigger full analysis
router.post("/analyze", validate(analyzeRepositorySchema), analyzeRepository);

// Get full analysis results
router.get("/analysis/:repoId", getAnalysis);

// Get health score (lightweight)
router.get("/health/:repoId", getHealthScore);

// Get security findings
router.get("/security/:repoId", getSecurityFindings);

// Get detected patterns
router.get("/patterns/:repoId", getPatterns);

// Get blast radius for a file
router.get("/blast/:repoId/*filePath", getBlastRadius);

// Get suggestions
router.get("/suggestions/:repoId", getSuggestions);

// Get PR Analysis files
router.get("/pr/:repoId/:prNumber", validate(getPRAnalysisSchema), getPRAnalysis);

export default router;
