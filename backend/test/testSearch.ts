import { vectorStore } from "../src/services/vector.service.js";

async function testSearch() {

  const results = await vectorStore.similaritySearch(
    "how user is created",
    2
  );

  console.log(results);
}

testSearch();