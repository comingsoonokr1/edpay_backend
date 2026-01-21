import { z } from "zod";
export const emailSchema = z
    .string()
    .email("Invalid email address")
    .toLowerCase();
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number");
export const mongoIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
