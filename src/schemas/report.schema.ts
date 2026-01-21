import { z } from "zod";

export const transactionsSummarySchema = z.object({
  query: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
});
