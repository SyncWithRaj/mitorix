import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import CircuitBreaker from "opossum";
import logger from "../lib/logger.js";

// ── Gemini API Key Parsing & Rotation ──
const rawGeminiKeys = process.env.GOOGLE_API_KEY || "";
export const geminiApiKeys = rawGeminiKeys.split(",").map(k => k.trim()).filter(Boolean);

if (geminiApiKeys.length === 0) {
  logger.warn("No GOOGLE_API_KEY provided in .env");
}

let currentGeminiKeyIndex = 0;

const getGeminiKey = (): string => {
  if (geminiApiKeys.length === 0) throw new Error("GOOGLE_API_KEY is missing from .env");
  return geminiApiKeys[currentGeminiKeyIndex];
};

const rotateGeminiKey = () => {
  if (geminiApiKeys.length <= 1) return;
  currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % geminiApiKeys.length;
  logger.warn(`[API KEY ROTATOR] Switched to Gemini API Key #${currentGeminiKeyIndex + 1} of ${geminiApiKeys.length}`);
};

// ── Groq API Key Parsing & Rotation ──
const rawGroqKeys = process.env.GROQ_API_KEY || "";
export const groqApiKeys = rawGroqKeys.split(",").map(k => k.trim()).filter(Boolean);

if (groqApiKeys.length === 0) {
  logger.warn("No GROQ_API_KEY provided in .env");
}

let currentGroqKeyIndex = 0;

const getGroqKey = (): string => {
  if (groqApiKeys.length === 0) throw new Error("GROQ_API_KEY is missing from .env");
  return groqApiKeys[currentGroqKeyIndex];
};

const rotateGroqKey = () => {
  if (groqApiKeys.length <= 1) return;
  currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqApiKeys.length;
  logger.warn(`[API KEY ROTATOR] Switched to Groq API Key #${currentGroqKeyIndex + 1} of ${groqApiKeys.length}`);
};

const GROQ_MODEL = "llama-3.3-70b-versatile"; // Latest stable fast model

// ── Groq Completion with Key Rotation ──
const callGroqCompletion = async (
  messages: Array<{ role: string; content: string }>,
  attempt = 1
): Promise<string> => {
  if (groqApiKeys.length === 0) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const maxAttempts = Math.max(1, groqApiKeys.length);
  const apiKey = getGroqKey();

  // Groq has strict payload/token limits. Truncate massive prompts.
  const safeMessages = messages.map(msg => {
    if (msg.content.length > 24000) {
      return { ...msg, content: msg.content.substring(0, 24000) + "\n\n[Content truncated due to length limits]" };
    }
    return msg;
  });

  try {
    const res = await axios.post(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        model: GROQ_MODEL,
        messages: safeMessages,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );

    return res.data?.choices?.[0]?.message?.content || "No response from Groq fallback.";
  } catch (error: any) {
    const isRateLimit = error?.response?.status === 429 || error?.message?.includes("429");
    if (attempt < maxAttempts && isRateLimit) {
      rotateGroqKey();
      logger.warn(`Groq 429 rate limit. Retrying with key #${currentGroqKeyIndex + 1} (Attempt ${attempt}/${maxAttempts})`);
      return callGroqCompletion(messages, attempt + 1);
    }

    // Prevent massive Axios error objects from flooding the logs
    if (axios.isAxiosError(error)) {
      throw new Error(`Groq API Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
};

// ── Gemini Single-Shot Completion with Key Rotation ──
const callGeminiCompletion = async (prompt: string, attempt = 1): Promise<string> => {
  if (geminiApiKeys.length === 0) {
    throw new Error("GOOGLE_API_KEY is missing");
  }

  const maxAttempts = Math.max(1, geminiApiKeys.length);
  const apiKey = getGeminiKey();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    logger.info({ provider: "Gemini", keyIndex: currentGeminiKeyIndex + 1 }, "Routing LLM request to Gemini (single-shot)");
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("Quota exceeded");

    if (attempt < maxAttempts && isRateLimit) {
      rotateGeminiKey();
      logger.warn(`Gemini 429/Quota limit. Retrying with key #${currentGeminiKeyIndex + 1} (Attempt ${attempt}/${maxAttempts})`);
      return callGeminiCompletion(prompt, attempt + 1);
    }
    throw error;
  }
};

// ── Single-shot call with Gemini rotation + Groq fallback ──
const callGeminiAPI = async (prompt: string) => {
  try {
    return await callGeminiCompletion(prompt);
  } catch (error: any) {
    logger.warn({ err: error.message }, "Gemini API failed after all key retries, attempting Groq fallback...");
    if (groqApiKeys.length > 0) {
      return await callGroqCompletion([{ role: "user", content: prompt }]);
    }
    throw error;
  }
};

// Configure the Circuit Breaker
const breakerOptions = {
  timeout: 45000, // Increased to 45s because complex prompts take time
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30s, try one request to see if the API is back up
};

const geminiBreaker = new CircuitBreaker(callGeminiAPI, breakerOptions);

// Fallback function: This runs if the breaker is OPEN or if a request fails/times out
geminiBreaker.fallback((prompt: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] Gemini API is down or timing out");
  return "Mitorix AI is currently experiencing high load or the LLM provider is down. Please try again later. We gracefully degraded to protect system stability.";
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

// Single-shot (non-chat) export
export const generateAnswer = async (prompt: string) => {
  return await geminiBreaker.fire(prompt);
};

// ── Multi-turn chat API ──
export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const callGeminiChat = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string,
  attempt = 1
): Promise<string> => {
  if (geminiApiKeys.length === 0) {
    throw new Error("GOOGLE_API_KEY is missing");
  }

  const maxAttempts = Math.max(1, geminiApiKeys.length);
  const apiKey = getGeminiKey();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = chatModel.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: any) {
    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("Quota exceeded");

    if (attempt < maxAttempts && isRateLimit) {
      rotateGeminiKey();
      logger.warn(`Gemini Chat 429/Quota limit. Retrying with key #${currentGeminiKeyIndex + 1} (Attempt ${attempt}/${maxAttempts})`);
      return callGeminiChat(systemInstruction, history, userMessage, attempt + 1);
    }
    throw error;
  }
};

const callChatAPI = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    if (groqApiKeys.length === 0) {
      throw new Error("GROQ_API_KEY is missing");
    }
    logger.info({ provider: "Groq" }, "Routing LLM request to Groq (chat)");

    const groqMessages = [
      { role: "system", content: systemInstruction },
      ...history.map(msg => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.parts.map(p => p.text).join("\n")
      })),
      { role: "user", content: userMessage }
    ];
    return await callGroqCompletion(groqMessages);
  } catch (error: any) {
    logger.warn({ err: error.message }, "Groq Chat API failed, attempting Gemini fallback...");
    return await callGeminiChat(systemInstruction, history, userMessage);
  }
};

const chatBreaker = new CircuitBreaker(callChatAPI, breakerOptions);

chatBreaker.fallback((_sys: string, _hist: ChatMessage[], _msg: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] Chat APIs are down or timing out");
  return "Mitorix AI is currently experiencing high load or the LLM providers are down. Please try again later.";
});

chatBreaker.on("open", () =>
  logger.warn("[Circuit Breaker] OPEN: Chat API is struggling")
);
chatBreaker.on("halfOpen", () =>
  logger.info("[Circuit Breaker] HALF-OPEN: Testing if Chat API is back online")
);
chatBreaker.on("close", () =>
  logger.info("[Circuit Breaker] CLOSED: Chat API is healthy again")
);

export const generateChatAnswer = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  return await chatBreaker.fire(systemInstruction, history, userMessage);
};
