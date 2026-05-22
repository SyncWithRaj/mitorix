import { Router } from "express";
import { searchCode } from "../controllers/search.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:repoId", protect, searchCode);

export default router;
