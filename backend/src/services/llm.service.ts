// import { GoogleGenerativeAI } from "@google/generative-ai"; // temporarily disabled
import axios from "axios";
import CircuitBreaker from "opossum";
import logger from "../lib/logger.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

if (!OPENAI_API_KEY) {
  logger.warn(
    "OPENAI_API_KEY is not set. LLM calls will fail until you configure it in backend/.env"
  );
}

const OPENAI_BASE_URL = "https://api.openai.com/v1";

const getOpenAIHeaders = () => ({
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  "Content-Type": "application/json",
});

const extractAssistantText = (data: any): string => {
  const firstChoice = data?.choices?.[0];
  const content = firstChoice?.message?.content;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .join("\n")
      .trim();
  }

  return "";
};

const callOpenAICompletion = async (messages: Array<{ role: string; content: string }>) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await axios.post(
    `${OPENAI_BASE_URL}/chat/completions`,
    {
      model: OPENAI_MODEL,
      messages,
    },
    {
      headers: getOpenAIHeaders(),
      timeout: 45000,
    }
  );

  const text = extractAssistantText(res.data);
  return text || "RepoLens AI returned an empty response. Please try again.";
};

// Configure the Circuit Breaker
const breakerOptions = {
  timeout: 45000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

// ── Legacy single-shot call (used by design docs, diagrams, etc.) ──
const singleShotBreaker = new CircuitBreaker(
  async (prompt: string) => callOpenAICompletion([{ role: "user", content: prompt }]),
  breakerOptions
);

singleShotBreaker.fallback((_prompt: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] OpenAI API is down or timing out");
  return "RepoLens AI is currently experiencing high load or the LLM provider is down. Please try again later. We gracefully degraded to protect system stability.";
});

singleShotBreaker.on("open", () =>
  logger.warn(
    { resetTimeoutSec: breakerOptions.resetTimeout / 1000 },
    "[Circuit Breaker] OPEN: OpenAI API is struggling — halting requests"
  )
);
singleShotBreaker.on("halfOpen", () =>
  logger.info("[Circuit Breaker] HALF-OPEN: Testing if OpenAI API is back online")
);
singleShotBreaker.on("close", () =>
  logger.info("[Circuit Breaker] CLOSED: OpenAI API is healthy again")
);

export const generateAnswer = async (prompt: string) => {
  return await singleShotBreaker.fire(prompt);
};

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const toPlainText = (parts: { text: string }[] = []) =>
  parts
    .map((p) => p?.text || "")
    .join("\n")
    .trim();

const callOpenAIChatAPI = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstruction },
  ];

  for (const msg of history) {
    const content = toPlainText(msg.parts);
    if (!content) continue;

    messages.push({
      role: msg.role === "model" ? "assistant" : "user",
      content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  return await callOpenAICompletion(messages);
};

const chatBreaker = new CircuitBreaker(callOpenAIChatAPI, breakerOptions);

chatBreaker.fallback((_sys: string, _hist: ChatMessage[], _msg: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] OpenAI Chat API is down or timing out");
  return "RepoLens AI is currently experiencing high load or the LLM provider is down. Please try again later.";
});

chatBreaker.on("open", () => logger.warn("[Circuit Breaker] OPEN: OpenAI Chat API is struggling"));
chatBreaker.on("halfOpen", () =>
  logger.info("[Circuit Breaker] HALF-OPEN: Testing if OpenAI Chat API is back online")
);
chatBreaker.on("close", () =>
  logger.info("[Circuit Breaker] CLOSED: OpenAI Chat API is healthy again")
);

export const generateChatAnswer = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  return await chatBreaker.fire(systemInstruction, history, userMessage);
};
