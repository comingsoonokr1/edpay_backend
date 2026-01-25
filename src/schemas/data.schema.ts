import { z } from "zod";

export const dataPurchaseSchema = z.object({
  body: z.object({
    serviceID: z.string().min(1, "Service ID is required"),
    planCode: z.string().min(1, "Plan code is required"),
    phone: z.string().regex(/^\d{10,15}$/, "Invalid phone number"),
    amount: z.number().positive("Amount must be positive").min(100, "Minimum amount is ₦100"), // Added optional min if needed
  }),
});