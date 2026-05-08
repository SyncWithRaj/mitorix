import fs from "fs";
import { Repository } from "../models/repo.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { FileContent } from "../models/fileContent.model.js";
import ChatHistory from "../models/chatHistory.model.js";
import { QdrantClient } from "@qdrant/js-client-rest";

/**
 * Purges all data associated with a repository from MongoDB, Qdrant, and the local filesystem.
 * This is used for the "Nuke My Data" feature and the automated TTL cleanup job.
 *
 * @param repoId The ID of the repository to purge.
 * @returns true if successful, false otherwise.
 */
export const purgeRepository = async (repoId: string): Promise<boolean> => {
  try {
    const repo = await Repository.findById(repoId);

    if (!repo) {
      console.log(`[Purge Utility] Repo not found for ID: ${repoId}`);
      return false;
    }

    console.log(`[Purge Utility] Starting purge for repo: ${repo.name} (${repoId})`);

    // 1. Clean up local filesystem clone (if it exists)
    if (repo.localPath && fs.existsSync(repo.localPath)) {
      try {
        fs.rmSync(repo.localPath, { recursive: true, force: true });
        console.log(`[Purge Utility] Cleaned up local path: ${repo.localPath}`);
      } catch (fsError) {
        console.error(`[Purge Utility] Failed to delete local path: ${repo.localPath}`, fsError);
        // Continue with other deletions even if fs cleanup fails
      }
    }

    // 2. Clean up Qdrant vectors
    if (repo.fingerprint) {
      // Check if fingerprint is shared by other repos before deleting vectors
      const count = await Repository.countDocuments({
        fingerprint: repo.fingerprint,
      });

      if (count <= 1) {
        try {
          const qdrant = new QdrantClient({
            url: process.env.QDRANT_URL || "http://localhost:6333",
            apiKey: process.env.QDRANT_API_KEY!,
          });

          const COLLECTION = "repo_entities";

          await qdrant.delete(COLLECTION, {
            filter: {
              must: [
                {
                  key: "metadata.fingerprint",
                  match: {
                    value: repo.fingerprint,
                  },
                },
              ],
            },
          });
          console.log(
            `[Purge Utility] Qdrant vectors deleted for fingerprint: ${repo.fingerprint}`
          );
        } catch (qdrantError: any) {
          if (qdrantError?.status === 404) {
            console.log("[Purge Utility] Qdrant collection not found (safe to skip)");
          } else {
            console.error("[Purge Utility] Qdrant deletion failed:", qdrantError);
            // Continue to delete MongoDB data even if Qdrant fails
          }
        }
      } else {
        console.log(
          `[Purge Utility] Skipping Qdrant deletion because fingerprint ${repo.fingerprint} is shared by ${count} repos.`
        );
      }
    }

    // 3. Clean up MongoDB data
    await CodeEntity.deleteMany({ repoId: repoId });
    await CodeRelationship.deleteMany({ repoId: repoId });
    await FileMetadata.deleteMany({ repoId: repoId });
    await FileContent.deleteMany({ repoId: repoId });
    await ChatHistory.deleteMany({ repoId: repoId });

    console.log(`[Purge Utility] MongoDB code data and chat history deleted.`);

    // 4. Delete the Repository document itself
    await repo.deleteOne();

    console.log(`[Purge Utility] Successfully purged repo: ${repoId}`);
    return true;
  } catch (error) {
    console.error(`[Purge Utility] Error purging repo ${repoId}:`, error);
    return false;
  }
};
