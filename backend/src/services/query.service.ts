import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import { generateChatAnswer, type ChatMessage } from "./llm.service.js";
import { searchVectors } from "./vector.service.js";
import path from "path";

// Approximate token count (1 token ≈ 4 chars). Gemini 2.5 Flash has ~1M tokens,
// but we cap context to leave room for the model's response.
const MAX_CONTEXT_CHARS = 120_000; // ~30k tokens for AST context
const MAX_HISTORY_PAIRS = 10; // Keep last 10 exchanges (20 messages)

export const askQuestion = async (repoId: string, question: string, history: any[] = []) => {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  // ── 1. Vector search for relevant code entities ──
  const results = await searchVectors(repoId, question);

  console.log("VECTOR RESULTS:", results.length, "matches");

  const entityIds = results.map((r: any) => r[0].metadata.mongoId);

  const entities = await CodeEntity.find({
    _id: { $in: entityIds },
  });

  const entityMap = new Map(entities.map((e: any) => [e._id.toString(), e]));

  const context = entityIds
    .map((id: string, index: number) => {
      const entity = entityMap.get(id);
      if (!entity) return null;

      const relativePath = path.relative(repo.localPath, entity.filePath).replace(/\\/g, "/");

      return {
        filePath: relativePath,
        code: entity.content,
        startLine: entity.startLine,
        endLine: entity.endLine,
        score: results[index][1],
      };
    })
    .filter((c: any) => c !== null);

  // ── 2. Build AST context string (with token budget) ──
  let astContextStr = "";
  for (const c of context) {
    const block = `\nFile: ${c.filePath}\nLines: ${c.startLine}-${c.endLine}\n\n${c.code}\n`;
    if (astContextStr.length + block.length > MAX_CONTEXT_CHARS) break;
    astContextStr += block;
  }

  // ── 3. Build system instruction (persona + rules) ──
  const systemInstruction = `You are RepoLens, a friendly and helpful AI assistant that helps developers understand a codebase.

Your job is to analyze code from a repository and answer questions clearly in normal text (no bold, italic, or special formatting).

Rules:
- Use the provided code context to answer questions. If the code context is thin or only shows imports/declarations, still do your best to synthesize an answer based on what you CAN see (file names, import paths, function signatures, struct names, etc.). Explain what the code likely does based on naming conventions and structure.
- Only refuse if the question is completely unrelated to programming or the repository (e.g., "what's the weather?"). In that case, reply politely that you can only answer questions related to the indexed repository.
- If the question IS related to the codebase:
  - Provide a short direct answer.
  - Explain what the relevant code does.
  - Mention which file the code belongs to and line numbers when relevant.
  - If the code relates to another component, explain that relationship.
  - IMPACT ANALYSIS: If the user asks about the impact, blast radius, consequences, or what breaks if a specific function or file is modified, include this exact tag at the very end of your response: <blast_radius file="exactFilePath" name="exactFunctionName" />. If asking about a file generally, leave name empty: <blast_radius file="exactFilePath" name="" />.
- You have access to conversation history. Use it to maintain context across messages. If the user refers to "it", "that function", "the previous code", etc., look at your conversation history to understand what they mean.

Response format (when the question IS related to the codebase):
1. Short direct answer
2. Explanation of what the code does
3. File location and line numbers`;

  // ── 4. Build Gemini-native chat history ──
  // Gemini requires alternating user/model roles. We inject the AST context
  // as the very first exchange so the model has it in its memory.
  const geminiHistory: ChatMessage[] = [];

  // Inject AST context as a synthetic first exchange
  if (astContextStr.trim()) {
    geminiHistory.push({
      role: "user",
      parts: [
        {
          text: `Here is the relevant code context from the repository for reference:\n${astContextStr}`,
        },
      ],
    });
    geminiHistory.push({
      role: "model",
      parts: [
        {
          text: "Thank you, I've reviewed the code context. I'm ready to answer questions about this codebase.",
        },
      ],
    });
  }

  // Append real chat history (capped to MAX_HISTORY_PAIRS)
  const recentHistory = history.slice(-(MAX_HISTORY_PAIRS * 2));
  for (const msg of recentHistory) {
    geminiHistory.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // ── 5. Call Gemini with native multi-turn ──
  const answer = await generateChatAnswer(systemInstruction, geminiHistory, question);

  const references = context
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => ({
      file: c.filePath,
      startLine: c.startLine,
      endLine: c.endLine,
    }));

  return {
    answer,
    references,
  };
};
