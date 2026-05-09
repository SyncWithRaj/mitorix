/**
 * Global error handling middleware.
 *
 * Handles both operational errors (AppError) and unexpected programmer errors.
 * Logs structured error details via Pino and returns a consistent JSON shape
 * to the client, never leaking internal stack traces in production.
 */
import type { Request, Response, NextFunction } from "express";
import logger from "../lib/logger.js";

/**
 * Operational error class.
 * Throw this in controllers/services to signal a known, expected error
 * (e.g., 404 not found, 400 bad request). Programmer errors should bubble up
 * naturally and will be caught as 500s.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code = "APP_ERROR", isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode: number = err.statusCode || err.status || 500;
  const isOperational: boolean = err.isOperational ?? false;
  const errorCode: string = err.code || "INTERNAL_ERROR";

  // Log with full detail server-side
  if (statusCode >= 500) {
    logger.error(
      { err, statusCode, isOperational, code: errorCode },
      err.message || "Unexpected server error"
    );
  } else {
    logger.warn(
      { statusCode, isOperational, code: errorCode },
      err.message || "Client error"
    );
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      code: errorCode,
    },
  });
};
