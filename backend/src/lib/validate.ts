/**
 * Zod validation middleware factory.
 *
 * Wraps a Zod schema and returns an Express middleware that validates
 * `req.body` against the schema. On success, `req.body` is replaced with
 * the parsed (and coerced) data. On failure, a structured 400 response
 * is returned with field-level error details.
 *
 * Usage:
 *   import { validate } from "../lib/validate.js";
 *   import { addRepositorySchema } from "../schemas/repo.schema.js";
 *
 *   router.post("/", protect, validate(addRepositorySchema), addRepository);
 */
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../middlewares/error.middleware.js";

export const validate =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      // Attempt to validate the whole request object (body, params, query)
      // if the schema supports it, otherwise fallback to body
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors).flat()[0] || "Validation failed";

        return next(new AppError(String(firstError), 400, "VALIDATION_ERROR"));
      }

      // Replace request parts with validated/transformed data
      if (result.data.body) req.body = result.data.body;
      if (result.data.params) req.params = result.data.params as any;
      if (result.data.query) req.query = result.data.query as any;

      next();
    };

