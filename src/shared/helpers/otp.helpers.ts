import crypto from "crypto";

export function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);
}

export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
