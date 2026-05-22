/**
 * Centralized Pino logger instance.
 *
 * In development, outputs human-readable colored logs via pino-pretty.
 * In production, outputs structured JSON for log aggregation tools
 * (e.g., Datadog, CloudWatch, Loki).
 *
 * Usage:
 *   import logger from "../lib/logger.js";
 *   logger.info("Server started");
 *   logger.error({ err }, "Something failed");
 */
import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export default logger;
