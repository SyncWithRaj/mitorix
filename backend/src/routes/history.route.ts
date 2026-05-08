import { Router } from "express";
import { getHistory, deleteHistory } from "../controllers/history.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();
router.get("/:repoId", protect, getHistory);
router.delete("/:repoId", protect, deleteHistory);

export default router;
