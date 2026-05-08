import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "RepoLens API is healthy and running!",
  });
});

export default router;
