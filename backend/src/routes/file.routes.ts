import express from "express";
import { getFileTree, getFileContent } from "../controllers/file.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/tree/:repoId", protect, getFileTree);
router.get("/content", protect, getFileContent);

export default router;
