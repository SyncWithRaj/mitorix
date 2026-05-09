/**
 * Zod validation schemas for repository-related request bodies.
 */
import { z } from "zod";

export const addRepositorySchema = z.object({
  body: z.object({
    githubUrl: z
      .string({ required_error: "githubUrl is required" })
      .url({ message: "Must be a valid URL" })
      .startsWith("https://github.com/", {
        message: "URL must point to a GitHub repository (https://github.com/...)",
      }),
  }),
});

export const processRepoSchema = z.object({
  body: z.object({
    githubUrl: z
      .string({ required_error: "githubUrl is required" })
      .url({ message: "Must be a valid URL" })
      .startsWith("https://github.com/", {
        message: "URL must point to a GitHub repository (https://github.com/...)",
      }),
  }),
});

export type AddRepositoryInput = z.infer<typeof addRepositorySchema>["body"];
export type ProcessRepoInput = z.infer<typeof processRepoSchema>["body"];
