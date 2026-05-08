import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";

// Reuse the existing connection pattern
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/**
 * Strict Rate Limiter for LLM Endpoints (Gemini, AssemblyAI, Murf)
 * Limits users/IPs to 20 requests per 15 minutes to prevent cost spikes and abuse.
 */
export const llmRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - rate-limit-redis has some typing quirks with ioredis, but it works
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
  message: {
    success: false,
    message: "You have exceeded your API request quota. Please try again later.",
  },
  // Extract userId if available (assuming user is attached by auth middleware before this)
  keyGenerator: (req: any, res: any) => {
    if (req.user && req.user._id) {
      return req.user._id.toString(); // Limit per authenticated user
    }
    return ipKeyGenerator(req, res); // Fallback to IP using built-in generator
  },
});
