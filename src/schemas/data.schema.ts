import { z } from "zod";

export const dataPurchaseSchema = z.object({
  userId: z.string().nonempty(),
  serviceID: z.string().nonempty(),
  planCode: z.string().nonempty(),
  phone: z.string().regex(/^\d{10,15}$/, "Invalid phone number"),
  amount: z.number().positive(),
});
