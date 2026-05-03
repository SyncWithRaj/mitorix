import fs from "fs";
import path from "path";
import os from "os";

/**
 * Base directory for all temporary repo clones.
 * Uses os.tmpdir() for cross-platform compatibility.
 */
export const TEMP_REPO_BASE = path.join(os.tmpdir(), "repolens-repos");

/**
 * Get the temp clone path for a specific repo.
 */
export function getTempRepoPath(userId: string, repoId: string): string {
    return path.join(TEMP_REPO_BASE, userId, repoId);
}

/**
 * Safely delete a temp cloned repo.
 * ONLY deletes paths under TEMP_REPO_BASE to prevent accidental deletion
 * of dashboard data or other files.
 */
export function cleanupTempRepo(repoPath: string): boolean {
    // Safety check: only delete paths under our temp base directory
    const resolved = path.resolve(repoPath);
    const base = path.resolve(TEMP_REPO_BASE);

    if (!resolved.startsWith(base)) {
        console.warn(
            `Safety Check: Refused to delete path outside temp directory: ${resolved}`
        );
        return false;
    }

    try {
        if (fs.existsSync(resolved)) {
            fs.rmSync(resolved, { recursive: true, force: true });
            console.log(`🧹 Cleaned up temp repo: ${resolved}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Failed to cleanup temp repo: ${resolved}`, error);
    }

    return false;
}
