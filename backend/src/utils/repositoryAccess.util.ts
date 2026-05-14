import mongoose from "mongoose";
import { Repository } from "../models/repo.model.js";
import { AppError } from "../middlewares/error.middleware.js";

type AuthLikeUser = { _id: string | { toString(): string } };

const normalizeString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0];
  return null;
};

export const requireString = (value: unknown, fieldName: string): string => {
  const normalized = normalizeString(value);
  if (!normalized) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  return normalized;
};

export const requireAuthUser = (user: unknown): AuthLikeUser => {
  if (!user || typeof user !== "object" || !("_id" in user)) {
    throw new AppError("Unauthorized", 401);
  }

  const candidate = user as { _id?: unknown };
  if (!candidate._id) {
    throw new AppError("Unauthorized", 401);
  }

  return candidate as AuthLikeUser;
};

export const ensureValidRepoId = (repoIdInput: unknown): string => {
  const repoId = requireString(repoIdInput, "Repository ID");
  if (!mongoose.Types.ObjectId.isValid(repoId)) {
    throw new AppError("Invalid repository id", 400);
  }
  return repoId;
};

export const getOwnedRepositoryOrThrow = async (repoIdInput: unknown, user: unknown) => {
  const repoId = ensureValidRepoId(repoIdInput);
  const authUser = requireAuthUser(user);

  const repo = await Repository.findOne({
    _id: repoId,
    user: String(authUser._id),
  });

  if (!repo) {
    throw new AppError("Repository not found", 404);
  }

  return repo;
};

export const getRepositoryForUserOrThrow = async (repoIdInput: unknown, userIdInput: unknown) => {
  const repoId = ensureValidRepoId(repoIdInput);
  const userId = requireString(userIdInput, "User ID");

  const repo = await Repository.findOne({
    _id: repoId,
    user: userId,
  });

  if (!repo) {
    throw new AppError("Repository not found", 404);
  }

  return repo;
};

export const assertRepoOwner = (repoUserId: unknown, userId: unknown) => {
  if (!repoUserId || !userId || String(repoUserId) !== String(userId)) {
    throw new AppError("Repository not found", 404);
  }
};
