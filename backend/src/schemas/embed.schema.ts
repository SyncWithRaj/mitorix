import { z } from "zod";

export const embedRepositorySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
