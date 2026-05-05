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
} from "../controllers/codeflow.controller.js";

const router = Router();

// Trigger full analysis
router.post("/analyze", analyzeRepository);

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

export default router;
