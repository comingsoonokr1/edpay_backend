import rateLimit from "express-rate-limit";

/**
 * Generic helper
 */
const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

/**
 * AUTH LIMITERS
 */
export const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5,              // 5 attempts
  "Too many login attempts. Try again later."
);

export const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  "Too many registration attempts."
);

export const forgotPasswordLimiter = createRateLimiter(
  15 * 60 * 1000,
  3,
  "Too many password reset requests."
);

export const refreshTokenLimiter = createRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many token refresh attempts."
);

export const resendOTPLimiter = createRateLimiter(
  10 * 60 * 1000, // 10 minutes
  3,              // max 3 resends
  "Too many OTP requests. Please wait before trying again."
);
