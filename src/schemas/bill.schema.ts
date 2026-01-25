import { z } from "zod";

export const payBillSchema = z.object({
  body: z.object({
    provider: z.string().min(1, "Provider is required"),
    customerId: z.string().min(1, "Customer ID is required"),
    amount: z.number().int().min(100, "Minimum payment is ₦100").positive(),
  }),
});

export const billStatusSchema = z.object({
  params: z.object({
    reference: z.string().min(1, "Reference is required"),
  }),
});
