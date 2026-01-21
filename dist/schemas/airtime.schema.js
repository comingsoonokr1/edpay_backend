import { z } from "zod";
export const purchaseAirtimeSchema = z.object({
    body: z.object({
        provider: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"]),
        phone: z
            .string()
            .regex(/^0[789][01]\d{8}$/, "Invalid Nigerian phone number"),
        amount: z.number().min(50, "Minimum airtime is ₦50"),
    }),
});
export const airtimeStatusSchema = z.object({
    params: z.object({
        reference: z.string().min(1),
    }),
});
