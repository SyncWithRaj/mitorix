import { QdrantClient } from "@qdrant/js-client-rest";
import logger from "../lib/logger.js";

const COLLECTION = "repo_entities";

export class VectorInitService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || "http://localhost:6333",
      apiKey: process.env.QDRANT_API_KEY!,
    });
  }

  async initVectorCollection() {
    const collections = await this.client.getCollections();

    const exists = collections.collections.find((c) => c.name === COLLECTION);

    if (exists) {
      // Ensure payload indexes exist even if collection already exists
      try {
        await this.client.createPayloadIndex(COLLECTION, {
          field_name: "metadata.fingerprint",
          field_schema: "keyword",
          wait: true,
        });
        await this.client.createPayloadIndex(COLLECTION, {
          field_name: "metadata.repoId",
          field_schema: "keyword",
          wait: true,
        });
        await this.client.createPayloadIndex(COLLECTION, {
          field_name: "metadata.filePath",
          field_schema: "keyword",
          wait: true,
        });
        await this.client.createPayloadIndex(COLLECTION, {
          field_name: "metadata.language",
          field_schema: "keyword",
          wait: true,
        });
      } catch (e: any) {
        logger.warn({ err: e.message }, "Vector index creation skipped or failed");
      }
      return {
        message: "Collection already exists, ensured payload indexes are present",
      };
    }

    await this.client.createCollection(COLLECTION, {
      vectors: {
        size: 3072,
        distance: "Cosine",
      },
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
      },
    });

    await this.client.createPayloadIndex(COLLECTION, {
      field_name: "metadata.fingerprint",
      field_schema: "keyword",
      wait: true,
    });
    await this.client.createPayloadIndex(COLLECTION, {
      field_name: "metadata.repoId",
      field_schema: "keyword",
      wait: true,
    });
    await this.client.createPayloadIndex(COLLECTION, {
      field_name: "metadata.filePath",
      field_schema: "keyword",
      wait: true,
    });
    await this.client.createPayloadIndex(COLLECTION, {
      field_name: "metadata.language",
      field_schema: "keyword",
      wait: true,
    });

    return {
      message: "repo_entities collection and payload index created",
    };
  }
}
