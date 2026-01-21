import { z } from "zod";

export const fundWalletSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

export const transferSchema = z.object({
  body: z.object({
    receiverEmail: z.string().email("Invalid receiver email"),
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});
