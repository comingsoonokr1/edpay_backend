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
// export const transferSchema = z.object({
//   body: z.object({
//     receiverEmail: z.string().email("Invalid receiver email"),
//     amount: z.number().positive("Amount must be greater than zero"),
//   }),
// });
export const transferSchema = z.object({
    body: z.object({
        method: z.enum(["user", "bank"]),
        recipient: z.string().optional(),
        bank: z.string().optional(),
        accountNumber: z.string().optional(),
        amount: z.number().positive(),
    }).refine((data) => data.method === "user"
        ? !!data.recipient
        : !!data.bank && !!data.accountNumber, {
        message: "Invalid transfer payload",
    }),
});
