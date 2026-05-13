import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import { generateChatAnswer, type ChatMessage } from "./llm.service.js";
import { searchVectors } from "./vector.service.js";
import path from "path";
import logger from "../lib/logger.js";

// Approximate token count (1 token ≈ 4 chars). Gemini 2.5 Flash has ~1M tokens,
// but we cap context to leave room for the model's response.
const MAX_CONTEXT_CHARS = 120_000; // ~30k tokens for AST context
const MAX_HISTORY_PAIRS = 10; // Keep last 10 exchanges (20 messages)

// Types that have vector embeddings in Qdrant (CodeEntity types)
const EMBEDDED_ENTITY_TYPES = new Set([
  "FOLDER",
  "FILE",
  "FUNCTION",
  "CLASS",
  "INTERFACE",
  "METHOD",
  "ARROW",
  "VARIABLE",
  "IMPORT",
  "EXPORT",
  "ENUM",
  "TYPE_ALIAS",
  "ROUTE",
  "CONSTRUCTOR",
  "PROPERTY",
  "STATIC_METHOD",
]);

// Types that carry their own context via metadata (no DB lookup)
const METADATA_ENTITY_TYPES = new Set([
  "SECURITY_ISSUE",
  "ARCHITECTURE_ISSUE",
  "PATTERN",
  "SUGGESTION",
  "DUPLICATE",
]);

interface AttachedNode {
  id: string;
  type: string;
  name: string;
  path?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export const askQuestion = async (
  repoId: string,
  question: string,
  history: any[] = [],
  attachedNodes: AttachedNode[] = [],
) => {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new Error("Repository not found");

  // ── 1. On-demand Vector Embedding if not already done ──
  if (!repo.isEmbedded) {
    logger.info({ repoId }, "On-demand embedding triggered for first chat");
    const { embedRepository } = await import("./embedRepository.service.js");
    await embedRepository(repoId);
    await Repository.findByIdAndUpdate(repoId, { isEmbedded: true });
    // Refresh repo object
    repo.isEmbedded = true;
  }

  // ── 1.5. Build EXPLICIT context from drag-dropped items ──
  let explicitContextStr = "";

  if (attachedNodes && attachedNodes.length > 0) {
    logger.info(
      { repoId, attachedCount: attachedNodes.length },
      "Processing drag-dropped attached nodes"
    );

    for (const node of attachedNodes) {
      if (EMBEDDED_ENTITY_TYPES.has(node.type)) {
        // These are CodeEntity types — try to fetch from MongoDB

        // Graph entity IDs follow the pattern "filePath::entityName"
        if (typeof node.id === "string" && node.id.includes("::")) {
          const [filePath, entityName] = node.id.split("::");
          const entities = await CodeEntity.find({
            repoId,
            filePath,
            name: entityName,
          }).limit(5);

          for (const e of entities) {
            const relativePath = path
              .relative(repo.localPath, e.filePath)
              .replace(/\\/g, "/");
            explicitContextStr += `\n[EXPLICITLY ATTACHED BY USER: ${e.type}] ${e.name}\nFile: ${relativePath}\nLines: ${e.startLine}-${e.endLine}\n\n${e.content}\n`;
          }
        } else if (node.type === "FILE" || node.type === "FOLDER") {
          // File or folder from left panel — node.id is the relative path
          // Try finding entities by file path match
          const searchPath = node.path || node.id;

          // Try absolute path first
          const fullPath = path.join(repo.localPath, searchPath);
          let entities = await CodeEntity.find({
            repoId,
            filePath: fullPath,
          }).limit(20);

          // If no results with absolute path, try as suffix match
          if (entities.length === 0) {
            entities = await CodeEntity.find({
              repoId,
              filePath: { $regex: searchPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$" },
            }).limit(20);
          }

          if (entities.length > 0) {
            for (const e of entities) {
              const relativePath = path
                .relative(repo.localPath, e.filePath)
                .replace(/\\/g, "/");
              explicitContextStr += `\n[EXPLICITLY ATTACHED BY USER: ${e.type}] ${e.name}\nFile: ${relativePath}\nLines: ${e.startLine}-${e.endLine}\n\n${e.content}\n`;

              // Respect token budget for explicit context too
              if (explicitContextStr.length > MAX_CONTEXT_CHARS * 0.4) break;
            }
          } else {
            // No entities found — still mention the path for awareness
            explicitContextStr += `\n[EXPLICITLY ATTACHED BY USER: ${node.type}] ${node.name}\nPath: ${searchPath}\n(No parsed entities found for this file)\n`;
          }
        } else {
          // Other graph entity nodes — try to find by exact filePath path
          const searchPath = node.path || node.id;
          const fullPath = path.join(repo.localPath, searchPath);
          const entities = await CodeEntity.find({
            repoId,
            filePath: fullPath,
            name: node.name,
          }).limit(5);

          for (const e of entities) {
            const relativePath = path
              .relative(repo.localPath, e.filePath)
              .replace(/\\/g, "/");
            explicitContextStr += `\n[EXPLICITLY ATTACHED BY USER: ${e.type}] ${e.name}\nFile: ${relativePath}\nLines: ${e.startLine}-${e.endLine}\n\n${e.content}\n`;
          }
        }
      } else if (METADATA_ENTITY_TYPES.has(node.type)) {
        // Right-panel items — use metadata directly (no DB lookup needed)
        explicitContextStr += `\n[EXPLICITLY ATTACHED BY USER: ${node.type}] ${node.name}\n`;
        if (node.path) explicitContextStr += `File: ${node.path}\n`;
        if (node.metadata) {
          for (const [key, value] of Object.entries(node.metadata)) {
            if (value !== undefined && value !== null && value !== "") {
              explicitContextStr += `${key}: ${value}\n`;
            }
          }
        }
        explicitContextStr += "\n";
      }

      // Hard cap on explicit context to not exhaust the budget
      if (explicitContextStr.length > MAX_CONTEXT_CHARS * 0.5) {
        logger.warn({ repoId }, "Explicit context truncated at 50% of budget");
        break;
      }
    }

    logger.info(
      { repoId, explicitLen: explicitContextStr.length },
      "Explicit drag-drop context built"
    );
  }

  // ── 2. Vector search for relevant code entities ──
  const results = await searchVectors(repoId, question);

  logger.debug({ repoId, matchCount: results.length }, "Vector search completed");

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

  // ── 2b. Build AST context string (explicit context goes FIRST — highest priority) ──
  let astContextStr = explicitContextStr;
  for (const c of context) {
    const block = `\nFile: ${c.filePath}\nLines: ${c.startLine}-${c.endLine}\n\n${c.code}\n`;
    if (astContextStr.length + block.length > MAX_CONTEXT_CHARS) break;
    astContextStr += block;
  }

  // ── 3. Build system instruction (persona + rules) ──
  const systemInstruction = `You are RepoLens, a friendly and helpful AI assistant that helps developers understand a codebase.

Your job is to analyze code from a repository and answer questions clearly in normal text (no bold, italic, or special formatting).

Rules:
- Items marked with [EXPLICITLY ATTACHED BY USER] were drag-and-dropped into the chat by the user. These are the PRIMARY context. Always prioritize these over vector search results when answering. Reference the specific attached code first.
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
    let content = msg.content;
    if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
      const attachmentsList = msg.attachments.map((a: any) => `${a.type}: ${a.name}`).join(", ");
      content = `[User attached: ${attachmentsList}]\n${content}`;
    }

    geminiHistory.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: content }],
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
