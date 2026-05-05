/**
 * CodeFlow — Controller
 *
 * REST endpoint handlers for triggering and retrieving CodeFlow analysis.
 */

import type { Request, Response } from "express";
import { runAnalysisPipeline } from "../services/codeflow/analysis.pipeline.js";
import { calcBlast } from "../services/codeflow/dependency.service.js";
import { Repository } from "../models/repo.model.js";

/**
 * POST /api/v1/codeflow/analyze
 * Trigger full CodeFlow analysis for a repository.
 * Body: { repoId: string }
 */
export const analyzeRepository = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId } = req.body;

    if (!repoId) {
      return res.status(400).json({ success: false, message: "repoId is required" });
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    console.log(`[CodeFlow] Starting analysis for repo ${repoId}...`);
    const startTime = Date.now();

    const analysisData = await runAnalysisPipeline(repoId);

    const elapsed = Date.now() - startTime;
    console.log(
      `[CodeFlow] Analysis complete: ${analysisData.stats.files} files, ` +
      `${analysisData.stats.functions} functions, ` +
      `${analysisData.stats.connections} connections in ${elapsed}ms`
    );

    return res.status(200).json({
      success: true,
      data: analysisData,
      meta: {
        elapsed,
        repoId,
      },
    });
  } catch (error: any) {
    console.error("[CodeFlow] Analysis failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Analysis failed",
    });
  }
};

/**
 * GET /api/v1/codeflow/analysis/:repoId
 * Get analysis results (re-runs pipeline — no caching yet).
 */
export const getAnalysis = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;

    if (!repoId) {
      return res.status(400).json({ success: false, message: "repoId is required" });
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    const analysisData = await runAnalysisPipeline(repoId);

    return res.status(200).json({
      success: true,
      data: analysisData,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Get analysis failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get analysis",
    });
  }
};

/**
 * GET /api/v1/codeflow/health/:repoId
 * Get health score only (lightweight).
 */
export const getHealthScore = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;

    const analysisData = await runAnalysisPipeline(repoId);

    return res.status(200).json({
      success: true,
      health: analysisData.health,
      stats: analysisData.stats,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Health score failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate health score",
    });
  }
};

/**
 * GET /api/v1/codeflow/security/:repoId
 * Get security findings only.
 */
export const getSecurityFindings = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;

    const analysisData = await runAnalysisPipeline(repoId);

    return res.status(200).json({
      success: true,
      securityIssues: analysisData.securityIssues,
      count: analysisData.securityIssues.length,
      highCount: analysisData.securityIssues.filter((i) => i.severity === "high").length,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Security scan failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get security findings",
    });
  }
};

/**
 * GET /api/v1/codeflow/patterns/:repoId
 * Get detected patterns only.
 */
export const getPatterns = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;

    const analysisData = await runAnalysisPipeline(repoId);

    return res.status(200).json({
      success: true,
      patterns: analysisData.patterns,
      count: analysisData.patterns.length,
      designPatterns: analysisData.patterns.filter((p) => !p.isAnti).length,
      antiPatterns: analysisData.patterns.filter((p) => p.isAnti).length,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Pattern detection failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to detect patterns",
    });
  }
};

/**
 * GET /api/v1/codeflow/blast/:repoId/:filePath
 * Get blast radius for a specific file.
 */
export const getBlastRadius = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;
    const filePath = decodeURIComponent(req.params.filePath || req.query.filePath as string || "");

    if (!filePath) {
      return res.status(400).json({ success: false, message: "filePath is required" });
    }

    const analysisData = await runAnalysisPipeline(repoId);
    const blast = calcBlast(filePath, analysisData.connections, analysisData.files);

    return res.status(200).json({
      success: true,
      blast,
      filePath,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Blast radius failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate blast radius",
    });
  }
};

/**
 * GET /api/v1/codeflow/suggestions/:repoId
 * Get actionable suggestions.
 */
export const getSuggestions = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.repoId;

    const analysisData = await runAnalysisPipeline(repoId);

    return res.status(200).json({
      success: true,
      suggestions: analysisData.suggestions,
      count: analysisData.suggestions.length,
    });
  } catch (error: any) {
    console.error("[CodeFlow] Suggestions failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate suggestions",
    });
  }
};
