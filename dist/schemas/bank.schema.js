import { z } from "zod";
export const linkBankSchema = z.object({
    body: z.object({
        bankName: z.string().min(2, "Bank name is required"),
        accountNumber: z
            .string()
            .regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
        accountName: z.string().min(3, "Account name is required"),
    }),
});
export const getUserBanksSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
    }),
});
