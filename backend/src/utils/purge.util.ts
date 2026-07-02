import fs from "fs";
import { Repository } from "../models/repo.model.js";
import { RepoParsedData } from "../models/repoParsedData.model.js";
import { FileContent } from "../models/fileContent.model.js";
import ChatHistory from "../models/chatHistory.model.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import logger from "../lib/logger.js";

/**
 * Purges all data associated with a repository from MongoDB, Qdrant, and the local filesystem.
 * This is used for the delete repository feature and the automated TTL cleanup job.
 *
 * @param repoId The ID of the repository to purge.
 * @returns true if successful, false otherwise.
 */
export const purgeRepository = async (repoId: string): Promise<boolean> => {
  try {
    const repo = await Repository.findById(repoId);

    if (!repo) {
      logger.warn({ repoId }, "Purge: repository not found");
      return false;
    }

    logger.info({ repoId, repoName: repo.name }, "Starting repository purge");

    // 1. Clean up local filesystem clone (if it exists)
    if (repo.localPath && fs.existsSync(repo.localPath)) {
      try {
        fs.rmSync(repo.localPath, { recursive: true, force: true });
        logger.info({ repoId, localPath: repo.localPath }, "Local filesystem path cleaned up");
      } catch (fsError) {
        logger.error(
          { err: fsError, repoId, localPath: repo.localPath },
          "Failed to delete local filesystem path"
        );
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
          logger.info(
            { repoId, fingerprint: repo.fingerprint },
            "Qdrant vectors deleted for fingerprint"
          );
        } catch (qdrantError: any) {
          if (qdrantError?.status === 404) {
            logger.info({ repoId }, "Qdrant collection not found — safe to skip");
          } else {
            logger.error({ err: qdrantError, repoId }, "Qdrant deletion failed");
            // Continue to delete MongoDB data even if Qdrant fails
          }
        }
      } else {
        logger.info(
          { repoId, fingerprint: repo.fingerprint, sharedCount: count },
          "Skipping Qdrant deletion — fingerprint is shared by multiple repos"
        );
      }
    }

    // 3. Clean up MongoDB data
    await RepoParsedData.deleteMany({ repoId: repoId });
    await FileContent.deleteMany({ repoId: repoId });
    await ChatHistory.deleteMany({ repoId: repoId });

    logger.info({ repoId }, "MongoDB code data and chat history deleted");

    // 4. Delete the Repository document itself
    await repo.deleteOne();

    logger.info({ repoId }, "Repository purged successfully");
    return true;
  } catch (error) {
    logger.error({ err: error, repoId }, "Error purging repository");
    return false;
  }
};
