import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "http://localhost:6333",
});

async function run() {
  await client.createCollection("repo_entities", {
    vectors: {
      size: 3072,
      distance: "Cosine",
    },
  });

  console.log("repo_entities collection successfully created");
}

run();
