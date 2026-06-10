import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

client
  .deleteCollection("repo_entities")
  .then(() => console.log("Deleted!"))
  .catch(console.error);
