import { Router } from "express";
import { embedRepositoryController } from "../controllers/embedrepository.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../lib/validate.js";
import { embedRepositorySchema } from "../schemas/embed.schema.js";

const router = Router();

router.post("/:id", protect, validate(embedRepositorySchema), embedRepositoryController);

export default router;
