import { Router } from "express";
import {
  addRepository,
  deleteRepository,
  getRepositoryById,
  getUserRepositories,
  scanRepository,
  processRepoController,
  jobStatusController,
  upload,
  uploadLocalRepository,
  getRepoSecurityIssues,
  getRepoArchitectureViolations,
  triggerEmbedding,
} from "../controllers/repo.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  requireFeature,
  requireRepoLimit,
} from "../middlewares/subscription.middleware.js";
import { validate } from "../lib/validate.js";
import { addRepositorySchema, processRepoSchema } from "../schemas/repo.schema.js";
import { parseRepoController } from "../controllers/parser.controller.js";
import { getRepositoryEntities } from "../controllers/codeEntity.controller.js";
import { getRepositoryoRelations } from "../controllers/relationship.controller.js";
import { getRepoFilesController } from "../controllers/fileMetadata.controller.js";
import { getRepositoryGraph } from "../controllers/graph.controller.js";
import { generateSystemDesignDoc } from "../controllers/designDoc.controller.js";
import { generateOnboardingGuide } from "../controllers/onboarding.controller.js";

const router = Router();

// ── Repo Creation (gated by tier repo limits + clone feature) ──
router.post("/", protect, requireRepoLimit, requireFeature("repo:clone"), validate(addRepositorySchema), addRepository);
router.post("/upload-local", protect, requireRepoLimit, requireFeature("repo:upload-local"), upload.single("file"), uploadLocalRepository);
router.post("/process", protect, requireRepoLimit, requireFeature("repo:clone"), validate(processRepoSchema), processRepoController);

// ── Job Status (all tiers — you can check your own jobs) ──
router.get("/jobs/:id/status", protect, jobStatusController);

// ── Repo Read/Delete (all tiers — you can view/delete your own repos) ──
router.get("/", protect, getUserRepositories);
router.get("/:id", protect, getRepositoryById);
router.delete("/:id", protect, deleteRepository);

// ── Repo Scanning & Parsing (all tiers) ──
router.get("/:id/scan", protect, scanRepository);
router.post("/:id/parse", protect, parseRepoController);

// ── Repo Data Retrieval (all tiers) ──
router.get("/:id/entities", protect, getRepositoryEntities);
router.get("/:id/relations", protect, getRepositoryoRelations);
router.get("/:id/files", protect, getRepoFilesController);
router.get("/:id/graph", protect, getRepositoryGraph);

// ── LLM-Powered Features (tier-gated) ──
router.get("/:id/design-doc", protect, requireFeature("repo:design-doc"), generateSystemDesignDoc);
router.get("/:id/onboarding", protect, requireFeature("repo:onboarding"), generateOnboardingGuide);

// ── Security & Architecture (accessible from FREE — part of CodeFlow analysis) ──
router.get("/:id/security", protect, requireFeature("codeflow:security"), getRepoSecurityIssues);
router.get("/:id/violations", protect, requireFeature("codeflow:patterns"), getRepoArchitectureViolations);

// ── Embedding (all tiers — needed for AI chat) ──
router.get("/:id/trigger-embedding", protect, requireFeature("repo:embed"), triggerEmbedding);

export default router;
