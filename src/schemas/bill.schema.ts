import { z } from "zod";

export const payBillSchema = z.object({
  body: z.object({
    provider: z.enum(["DSTV", "GOTV", "PHCN", "WATER"]),
    customerId: z.string().min(1, "Customer ID is required"),
    amount: z.number().min(100, "Minimum payment is ₦100"),
  }),
});

export const billStatusSchema = z.object({
  params: z.object({
    reference: z.string().min(1, "Reference is required"),
  }),
});
