import { CodeEntity } from "../models/codeEntity.model.js";
import { searchVectors } from "./vector.service.js";
import { buildPrompt } from "./prompt.service.js";
import { generateAnswer } from "./llm.service.js";
import { embedText } from "./embedding.service.js";

export const runRAGPipeline = async (repoId: string, question: string) => {
  const queryEmbedding = await embedText(question);

  const entityIds = await searchVectors(queryEmbedding);

  const entities = await CodeEntity.find({
    _id: { $in: entityIds },
    repoId,
  });

  const prompt = buildPrompt(question, entities);

  const answer = await generateAnswer(prompt);

  return {
    answer,
    sources: entities.map((e) => ({
      filePath: e.filePath,
      startLine: e.startLine,
      endLine: e.endLine,
    })),
  };
};
