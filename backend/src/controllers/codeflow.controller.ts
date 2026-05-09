/**
 * CodeFlow — Controller
 *
 * REST endpoint handlers for triggering and retrieving CodeFlow analysis.
 */

import type { Request, Response } from "express";
import axios from "axios";
import { runAnalysisPipeline } from "../services/codeflow/analysis.pipeline.js";
import { calcBlast } from "../services/codeflow/dependency.service.js";
import { Repository } from "../models/repo.model.js";
import logger from "../lib/logger.js";

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

    logger.info({ repoId }, "CodeFlow: starting analysis pipeline");
    const startTime = Date.now();
    const excludes = ((req.query.excludes as string) || "").split(",").filter(Boolean);

    const analysisData = await runAnalysisPipeline(repoId, excludes);

    const elapsed = Date.now() - startTime;
    logger.info(
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
    logger.error({ err: error }, "CodeFlow: analysis failed");
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

    const excludes = ((req.query.excludes as string) || "").split(",").filter(Boolean);
    const analysisData = await runAnalysisPipeline(repoId, excludes);

    return res.status(200).json({
      success: true,
      data: analysisData,
    });
  } catch (error: any) {
    logger.error({ err: error }, "CodeFlow: get analysis failed");
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
    logger.error({ err: error }, "CodeFlow: health score failed");
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
    logger.error({ err: error }, "CodeFlow: security scan failed");
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
    logger.error({ err: error }, "CodeFlow: pattern detection failed");
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
    const filePath = decodeURIComponent(
      req.params.filePath || (req.query.filePath as string) || ""
    );

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
    logger.error({ err: error }, "CodeFlow: blast radius failed");
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
    logger.error({ err: error }, "CodeFlow: suggestions failed");
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate suggestions",
    });
  }
};

/**
 * GET /api/v1/codeflow/pr/:repoId/:prNumber
 * Fetch PR files from GitHub API for PR Risk Analysis.
 */
export const getPRAnalysis = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId, prNumber } = req.params;

    if (!repoId || !prNumber) {
      return res.status(400).json({ success: false, message: "repoId and prNumber are required" });
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    // Extract owner and repo name from githubUrl
    const urlParts = repo.githubUrl.replace("https://github.com/", "").split("/");
    const owner = urlParts[0];
    const repoName = urlParts[1].replace(".git", "");

    logger.info({ repoId, owner, repoName, prNumber }, "CodeFlow: fetching PR files");

    // Fetch PR files from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // We can optionally use a token if available to avoid rate limits
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );

    // Get basic PR info for additions/deletions totals
    const prResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        files: response.data,
        additions: prResponse.data.additions,
        deletions: prResponse.data.deletions,
      },
    });
  } catch (error: any) {
    logger.error({ err: error?.response?.data || error.message }, "CodeFlow: PR fetch failed");
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || "Failed to fetch PR",
    });
  }
};
