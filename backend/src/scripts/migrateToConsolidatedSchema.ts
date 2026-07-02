import mongoose from "mongoose";
import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";
import { Repository } from "../models/repo.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { RepoParsedData, type IParsedEntity, type IParsedRelationship, type IParsedFileMetadata } from "../models/repoParsedData.model.js";
import logger from "../lib/logger.js";

dotenv.config({ path: "../../.env" });

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY!,
});

const COLLECTION = "repo_entities";

async function migrate() {
  logger.info("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/repolens");
  logger.info("Connected to MongoDB.");

  const repos = await Repository.find({}).lean();
  logger.info(`Found ${repos.length} repositories to check for migration.`);

  for (const repo of repos) {
    const repoId = repo._id;
    
    // Check if already migrated
    const existing = await RepoParsedData.findOne({ repoId });
    if (existing) {
      logger.info(`Repo ${repoId} already migrated. Skipping.`);
      continue;
    }

    logger.info(`Migrating repo ${repoId}...`);

    // 1. Fetch old data
    const entities = await CodeEntity.find({ repoId }).lean();
    const relationships = await CodeRelationship.find({ repoId }).lean();
    const files = await FileMetadata.find({ repoId }).lean();

    if (entities.length === 0 && files.length === 0) {
      logger.info(`Repo ${repoId} has no parsed data. Skipping.`);
      continue;
    }

    // 2. Build filePaths map
    const filePathsArray: string[] = [];
    const filePathToIndex = new Map<string, number>();

    const addFilePath = (filePath: string) => {
      if (!filePath) return -1;
      if (!filePathToIndex.has(filePath)) {
        filePathToIndex.set(filePath, filePathsArray.length);
        filePathsArray.push(filePath);
      }
      return filePathToIndex.get(filePath)!;
    };

    // 3. Map entities and set entityIndex
    const mongoIdToIndex = new Map<string, number>();
    const newEntities: IParsedEntity[] = [];
    
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i] as any;
      const eIdStr = e._id.toString();
      mongoIdToIndex.set(eIdStr, i);
      
      newEntities.push({
        name: e.name,
        type: e.type,
        fileIdx: addFilePath(e.filePath),
        startLine: e.startLine || 0,
        endLine: e.endLine || 0,
        language: e.language || "unknown",
        parameters: e.parameters || [],
        returnType: e.returnType || "",
        scopeDepth: 0,
        parentName: null,
        embeddingId: e.embedded ? "legacy-migrated" : undefined,
      });
    }

    // 4. Map relationships
    const newRelationships: IParsedRelationship[] = [];
    for (const r of relationships as any[]) {
      newRelationships.push({
        fromName: r.fromName || "",
        fromFileIdx: addFilePath(r.fromFilePath),
        toName: r.toName || "",
        toFileIdx: addFilePath(r.toFilePath),
        relationType: r.relationType || "calls",
        line: r.line || 0,
        count: 1,
        isExternal: false
      });
    }

    // 5. Map file metadata
    const newFiles: IParsedFileMetadata[] = files.map((f: any) => ({
      fileIdx: addFilePath(f.filePath),
      language: f.language || "unknown",
      fileSize: 0,
      totalLines: 0,
      hasDefaultExport: false,
      hasReactComponent: false,
      isBackendFile: false,
      isTestFile: false
    }));

    // 6. Create new consolidated document
    const consolidated = new RepoParsedData({
      repoId,
      filePaths: filePathsArray,
      entities: newEntities,
      relationships: newRelationships,
      fileMetadata: newFiles
    });
    
    await consolidated.save();
    logger.info(`Saved RepoParsedData for repo ${repoId} with ${newEntities.length} entities.`);

    // 7. Update Qdrant payloads to add entityIndex
    if (repo.fingerprint) {
      try {
        let nextOffset: string | number | null | undefined = undefined;
        let pointsUpdated = 0;
        
        do {
          const scrollResult: any = await qdrant.scroll(COLLECTION, {
            filter: {
              must: [
                { key: "metadata.repoId", match: { value: repoId.toString() } },
              ],
            },
            with_payload: true,
            limit: 100,
            ...(nextOffset !== undefined ? { offset: nextOffset } : {}),
          });
          
          const updates = [];
          for (const point of scrollResult.points) {
            const mId = point.payload?.metadata?.mongoId;
            if (mId && mongoIdToIndex.has(mId)) {
              updates.push({
                id: point.id,
                payload: {
                  metadata: {
                    ...point.payload.metadata,
                    entityIndex: mongoIdToIndex.get(mId)
                  }
                }
              });
            }
          }
          
          if (updates.length > 0) {
            for (const chunk of updates) {
              await qdrant.setPayload(COLLECTION, {
                payload: chunk.payload,
                points: [chunk.id]
              });
              pointsUpdated++;
            }
          }

          nextOffset = scrollResult.next_page_offset;
        } while (nextOffset !== null && nextOffset !== undefined);
        
        logger.info(`Updated ${pointsUpdated} Qdrant points with entityIndex for repo ${repoId}.`);
      } catch (err) {
        logger.error(`Error updating Qdrant points for repo ${repoId}: ${err}`);
      }
    }
  }

  logger.info("Migration complete! You can now safely delete the CodeEntity, CodeRelationship, and FileMetadata collections.");
  process.exit(0);
}

migrate().catch(err => {
  logger.error("Migration script failed: ", err);
  process.exit(1);
});
