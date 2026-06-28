import fs from "fs";
import path from "path";
import os from "os";
import logger from "../lib/logger.js";

/**
 * Base directory for all temporary repo clones.
 * Uses os.tmpdir() for cross-platform compatibility.
 */
export const TEMP_REPO_BASE = path.join(os.tmpdir(), "mitorix-repos");

/**
 * Get the temp clone path for a specific repo.
 */
export function getTempRepoPath(userId: string, repoId: string): string {
  return path.join(TEMP_REPO_BASE, userId, repoId);
}

/**
 * Safely delete a temp cloned repo.
 * ONLY deletes paths under TEMP_REPO_BASE to prevent accidental deletion
 * of other files on the filesystem.
 */
export function cleanupTempRepo(repoPath: string): boolean {
  // Safety check: only delete paths under our temp base directory
  const resolved = path.resolve(repoPath);
  const base = path.resolve(TEMP_REPO_BASE);

  if (!resolved.startsWith(base)) {
    logger.warn(
      { resolved, base },
      "Safety check: refused to delete path outside temp directory"
    );
    return false;
  }

  try {
    if (fs.existsSync(resolved)) {
      fs.rmSync(resolved, { recursive: true, force: true });
      logger.info({ path: resolved }, "Cleaned up temp repository directory");
      return true;
    }
  } catch (error) {
    logger.error({ err: error, path: resolved }, "Failed to clean up temp repository directory");
  }

  return false;
}
