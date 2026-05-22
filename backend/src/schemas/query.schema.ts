/**
 * Zod validation schemas for query/chat request bodies.
 */
import { z } from "zod";

const attachedNodeSchema = z.object({
  id: z.string().min(1, { message: "attachedNodes.id is required" }),
  type: z.string().min(1, { message: "attachedNodes.type is required" }),
  name: z.string().min(1, { message: "attachedNodes.name is required" }),
  path: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const queryBodySchema = z
  .object({
    repoId: z.string().min(1, { message: "repoId cannot be empty" }),
    question: z
      .string()
      .trim()
      .max(2000, { message: "question must be under 2000 characters" })
      .optional()
      .default(""),
    attachedNodes: z.array(attachedNodeSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const hasQuestion = data.question.trim().length > 0;
    const hasAttachments = data.attachedNodes.length > 0;

    if (!hasQuestion && !hasAttachments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["question"],
        message: "Provide a question or attach at least one context node",
      });
    }
  });

export const querySchema = z.object({
  body: queryBodySchema,
});

export type QueryInput = z.infer<typeof querySchema>["body"];
