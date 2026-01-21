import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    amount: z.number().min(1, "Amount must be greater than zero"),
    channel: z.enum(["card", "bank", "wallet"]),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    reference: z.string().min(1, "Reference is required"),
  }),
});

export const transactionIdSchema = z.object({
  params: z.object({
    transactionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID"),
  }),
});
