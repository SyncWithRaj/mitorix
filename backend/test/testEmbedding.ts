import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { embeddingModel } from "../src/services/embedding.service.js";

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
    console.log("Expected: 768 (nomic-embed-text)");
    console.log("Match:", vector.length === 768 ? "✅" : "❌");
  } catch (err) {
    console.error("Error ❌", err);
  }
}

testEmbedding();
