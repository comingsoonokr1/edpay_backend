import { z } from "zod";

export const purchaseAirtimeSchema = z.object({
  body: z.object({
    provider: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"]),

    phone: z
      .string()
      .regex(
        /^0\d{10}$/,
        "Invalid Nigerian phone number"
      ),

    amount: z
      .preprocess((val) => Number(val), z.number().min(50, "Minimum airtime is ₦50")),

    debitAccountNumber: z
      .string()
      .min(10, "Invalid debit account number"),

    transactionPin: z
      .string()
      .min(4, "Transaction PIN must be at least 4 digits"),

    statusUrl: z.string().url().optional(),
  }),
});


export const airtimeStatusSchema = z.object({
  params: z.object({
    reference: z.string().min(1),
  }),
});
