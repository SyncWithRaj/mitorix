import express from "express";
import { getFileTree, getFileContent } from "../controllers/file.controller.js";

const router = express.Router();

router.get("/tree/:repoId", getFileTree);
router.get("/content", getFileContent);

export default router;
