import { GoogleGenerativeAI } from "@google/generative-ai";
import CircuitBreaker from "opossum";
import logger from "../lib/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ── Legacy single-shot call (used by design docs, diagrams, etc.) ──
const callGeminiAPI = async (prompt: string) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// Configure the Circuit Breaker
const breakerOptions = {
  timeout: 45000, // Increased to 45s because complex prompts (like AST to Mermaid) take time
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30s, try one request to see if the API is back up
};

const geminiBreaker = new CircuitBreaker(callGeminiAPI, breakerOptions);

// Fallback function: This runs if the breaker is OPEN or if a request fails/times out
geminiBreaker.fallback((prompt: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] Gemini API is down or timing out");
  return "RepoLens AI is currently experiencing high load or the LLM provider is down. Please try again later. We gracefully degraded to protect system stability.";
});

// Event listeners for observability
geminiBreaker.on("open", () =>
  logger.warn(
    { resetTimeoutSec: breakerOptions.resetTimeout / 1000 },
    "[Circuit Breaker] OPEN: Gemini API is struggling — halting requests"
  )
);
geminiBreaker.on("halfOpen", () =>
  logger.info("[Circuit Breaker] HALF-OPEN: Testing if Gemini API is back online")
);
geminiBreaker.on("close", () =>
  logger.info("[Circuit Breaker] CLOSED: Gemini API is healthy again")
);

// Legacy single-shot (non-chat) export
export const generateAnswer = async (prompt: string) => {
  // Use the circuit breaker to execute the API call
  return await geminiBreaker.fire(prompt);
};

// ── NEW: Native multi-turn chat API ──
// This properly preserves conversation history by using Gemini's startChat()
// instead of stuffing everything into a single flat prompt.

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const callGeminiChatAPI = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction,
  });

  const chat = chatModel.startChat({
    history: history,
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};

const chatBreaker = new CircuitBreaker(callGeminiChatAPI, breakerOptions);

chatBreaker.fallback((_sys: string, _hist: ChatMessage[], _msg: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] Gemini Chat API is down or timing out");
  return "RepoLens AI is currently experiencing high load or the LLM provider is down. Please try again later.";
});

chatBreaker.on("open", () =>
  logger.warn("[Circuit Breaker] OPEN: Gemini Chat API is struggling")
);
chatBreaker.on("halfOpen", () =>
  logger.info("[Circuit Breaker] HALF-OPEN: Testing if Gemini Chat API is back online")
);
chatBreaker.on("close", () =>
  logger.info("[Circuit Breaker] CLOSED: Gemini Chat API is healthy again")
);

export const generateChatAnswer = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  return await chatBreaker.fire(systemInstruction, history, userMessage);
};
