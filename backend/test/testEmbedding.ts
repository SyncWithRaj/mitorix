import { embeddingModel } from "../src/services/embedding.service.js";
import { vectorStore } from "../src/services/vector.service.js";

async function testEmbedding() {
  try {
    const text = `
Function: createUser
File: controllers/user.controller.ts

function createUser(req,res){
  const user = new User(req.body)
  await user.save()
  res.json(user)
}
`;

    // Step 1 — check embedding generation
    const vector = await embeddingModel.embedQuery(text);

    console.log("Vector generation successful");
    console.log("Vector length:", vector.length);

    // Step 2 — insert into Qdrant using LangChain
    await vectorStore.addDocuments([
      {
        pageContent: text,
        metadata: {
          test: true,
          name: "createUser",
        },
      },
    ]);

    console.log("Insertion into Qdrant successful");

  } catch (err) {
    console.error("Error ❌", err);
  }
}

testEmbedding();