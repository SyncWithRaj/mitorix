/**
 * Zod validation schemas for query/chat request bodies.
 */
import { z } from "zod";

export const querySchema = z.object({
  body: z.object({
    repoId: z
      .string({ required_error: "repoId is required" })
      .min(1, { message: "repoId cannot be empty" }),
    question: z
      .string({ required_error: "question is required" })
      .min(1, { message: "question cannot be empty" })
      .max(2000, { message: "question must be under 2000 characters" }),
  }),
});

export type QueryInput = z.infer<typeof querySchema>["body"];
