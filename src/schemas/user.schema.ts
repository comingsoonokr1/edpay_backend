import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.schema.js";

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(3).optional(),
    email: emailSchema.optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
  }),
});
