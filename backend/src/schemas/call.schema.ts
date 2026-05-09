/**
 * Zod validation schemas for voice call request bodies.
 */
import { z } from "zod";

export const processCallSchema = z.object({
  body: z.object({
    repoId: z
      .string({ required_error: "repoId is required" })
      .min(1, { message: "repoId cannot be empty" }),
    audioBase64: z
      .string({ required_error: "audioBase64 is required" })
      .min(1, { message: "audioBase64 cannot be empty" }),
  }),
});

export type ProcessCallInput = z.infer<typeof processCallSchema>["body"];
