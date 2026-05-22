import { z } from "zod";

export const analyzeRepositorySchema = z.object({
  body: z.object({
    repoId: z.string({
      required_error: "Repository ID is required",
    }),
  }),
  query: z.object({
    excludes: z.string().optional(),
  }),
});

export const getPRAnalysisSchema = z.object({
  params: z.object({
    repoId: z.string(),
    prNumber: z.string(),
  }),
});
