import { z } from "zod";

export const storeCardSchema = z.object({
  body: z.object({
    cardLast4: z
      .string()
      .length(4, "Last 4 digits of card must be exactly 4 digits")
      .regex(/^\d{4}$/, "Last 4 digits must be numeric"),
    cardType: z.string().min(2, "Card type is required"), // e.g., Visa, MasterCard
    token: z.string().min(1, "Token is required"),
    expiryMonth: z
      .string()
      .regex(/^(0?[1-9]|1[0-2])$/, "Expiry month must be 1-12"),
    expiryYear: z
      .string()
      .regex(/^\d{4}$/, "Expiry year must be 4 digits"),
  }),
});

export const removeCardSchema = z.object({
  params: z.object({
    cardId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid card ID"),
  }),
});
