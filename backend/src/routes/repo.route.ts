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

router.post("/", protect, validate(addRepositorySchema), addRepository);
router.post("/upload-local", protect, upload.single("file"), uploadLocalRepository);
router.post("/process", protect, validate(processRepoSchema), processRepoController);
router.get("/jobs/:id/status", protect, jobStatusController);
router.get("/", protect, getUserRepositories);
router.get("/:id", protect, getRepositoryById);
router.delete("/:id", protect, deleteRepository);
router.get("/:id/scan", protect, scanRepository);
router.post("/:id/parse", protect, parseRepoController);
router.get("/:id/entities", protect, getRepositoryEntities);
router.get("/:id/relations", protect, getRepositoryoRelations);
router.get("/:id/files", getRepoFilesController);
router.get("/:id/graph", protect, getRepositoryGraph);
router.get("/:id/design-doc", protect, generateSystemDesignDoc);
router.get("/:id/onboarding", protect, generateOnboardingGuide);
router.get("/:id/security", protect, getRepoSecurityIssues);
router.get("/:id/violations", protect, getRepoArchitectureViolations);
router.post("/:id/trigger-embedding", protect, triggerEmbedding);

export default router;
