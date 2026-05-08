import { Router } from "express";
import { embedRepositoryController } from "../controllers/embedrepository.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:id", protect, embedRepositoryController);

export default router;
