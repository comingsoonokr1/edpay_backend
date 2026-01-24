import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.schema.js";
export const registerSchema = z.object({
    body: z.object({
        fullName: z.string().min(3, "Full name is required"),
        email: emailSchema,
        password: passwordSchema,
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: z.string().min(1, "Password is required"),
    }),
});
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "Refresh token is required"),
    }),
});
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: emailSchema,
    }),
});
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
        newPassword: passwordSchema,
    }),
});
export const verifyEmailSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});
export const verifyPhoneOTPSchema = z.object({
    body: z.object({
        phoneNumber: z.string().min(1, "Phone number is required"),
        otp: z.string().length(6),
    }),
});
export const resendOTPSchema = z.object({
    body: z.object({
        phoneNumber: z.string().min(1, "Phone number is required"),
    }),
});
