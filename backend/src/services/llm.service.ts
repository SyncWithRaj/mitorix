import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import CircuitBreaker from "opossum";
import logger from "../lib/logger.js";

// ── API Key Parsing ──
const rawKeys = process.env.GOOGLE_API_KEY || "";
export const geminiApiKeys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);

if (geminiApiKeys.length === 0) {
  logger.warn("No GOOGLE_API_KEY provided in .env");
}

// ── Active provider: Gemini ──
// We use the first key as the default for the main LLM instance
export const genAI = new GoogleGenerativeAI(geminiApiKeys[0] || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// ── Groq Fallback Provider ──
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Latest stable fast model

const callGroqCompletion = async (messages: Array<{ role: string; content: string }>) => {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing for fallback");
  }
  
  logger.info({ model: GROQ_MODEL }, "Routing LLM request to Groq fallback");

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
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );

    return res.data?.choices?.[0]?.message?.content || "No response from Groq fallback.";
  } catch (error: any) {
    // Prevent massive Axios error objects from flooding the logs
    if (axios.isAxiosError(error)) {
      throw new Error(`Groq API Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
};

// ── Legacy single-shot call (used by design docs, diagrams, etc.) ──
const callGeminiAPI = async (prompt: string) => {
  try {
    logger.info({ provider: "Gemini" }, "Routing LLM request to Gemini (single-shot)");
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    logger.warn({ err: error.message }, "Gemini API failed, attempting Groq fallback...");
    if (process.env.GROQ_API_KEY) {
      return await callGroqCompletion([{ role: "user", content: prompt }]);
    }
    throw error;
  }
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

// Legacy single-shot (non-chat) export
export const generateAnswer = async (prompt: string) => {
  return await geminiBreaker.fire(prompt);
};

// ── Multi-turn chat API ──
// Uses Gemini's native startChat() to properly preserve conversation history.

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const callGeminiChatAPI = async (
  systemInstruction: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> => {
  try {
    logger.info({ provider: "Gemini" }, "Routing LLM request to Gemini (chat)");
    
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const chat = chatModel.startChat({
      history: history,
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error: any) {
    logger.warn({ err: error.message }, "Gemini Chat API failed, attempting Groq fallback...");
    if (process.env.GROQ_API_KEY) {
      const groqMessages = [
        { role: "system", content: systemInstruction },
        ...history.map(msg => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts.map(p => p.text).join("\n")
        })),
        { role: "user", content: userMessage }
      ];
      return await callGroqCompletion(groqMessages);
    }
    throw error;
  }
};

const chatBreaker = new CircuitBreaker(callGeminiChatAPI, breakerOptions);

chatBreaker.fallback((_sys: string, _hist: ChatMessage[], _msg: string, error?: Error) => {
  logger.error({ err: error }, "[Circuit Breaker] Gemini Chat API is down or timing out");
  return "Mitorix AI is currently experiencing high load or the LLM provider is down. Please try again later.";
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
