import { User } from "../model/User.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper.js";
import crypto from "crypto";
import { TokenService } from "./token.service.js";
import { generateOTP, hashOTP } from "../shared/helpers/otp.helpers.js";
import { sendOTPEmail } from "../shared/helpers/email.helper.js";



export class AuthService {
  static async register(fullName: string, email: string, password: string, phoneNumber: string) {
    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(403, "User already exists");

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);

    try {
      await sendOTPEmail(email, otp);
    } catch (error) {
      console.error("OTP email failed:", error);

      throw new ApiError(
        500,
        "Unable to send OTP email. Please try again later"
      );
    }


    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      emailOtp: hashedOtp,
      emailOtpExpiry: new Date(Date.now() + 10 * 60 * 1000), //10 mins 
      isEmailVerified: false
    });

    // Wallet creation should be done separately in WalletService or controller

    return user;
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new ApiError(401, "Invalid credentials");

    // if (!user.isEmailVerified) {
    //   throw new ApiError(403, "Please verify your email first");
    // }

    const userId = user._id.toString();

    const accessToken = TokenService.generateAccessToken({ userId, role: user.role });

    const refreshToken = TokenService.
      generateRefreshToken(userId);

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  static async logout(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.refreshToken = null;
    await user.save();
  }

  static async refreshToken(refreshToken: string) {
    const user = await User.findOne({ refreshToken });
    if (!user) throw new ApiError(401, "Invalid refresh token");

    const accessToken = TokenService.generateAccessToken({ userId: user._id.toString(), role: user.role });
    return accessToken;
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // Generate token (can use crypto or UUID)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    user.forgotPasswordToken = token;
    user.forgotPasswordExpiry = expiry;
    await user.save();

    // Send token via email service here (outside service responsibility)
    return token;
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
      forgotPasswordToken: token,
      forgotPasswordExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(401, "Invalid or expired token");

    user.password = await hashPassword(newPassword);
    user.forgotPasswordToken = null;
    user.forgotPasswordExpiry = null;
    await user.save();
  }

  static async verifyEmailOTP(email: string, otp: string) {
    const hashedOtp = hashOTP(otp);

    const user = await User.findOne({
      email,
      emailOtp: hashedOtp,
      emailOtpExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(401, "Invalid or expired OTP");

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;

    await user.save();
  }

  static async resendOTP(email: string) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // Optional: limit resend attempts e.g max 5 times per day
  if (user.otpResendLimit && user.otpResendLimit >= 5) {
    throw new ApiError(429, "Maximum OTP resend attempts reached");
  }

  // Cooldown between resends (e.g 1 min)
  const now = new Date();
  if (user.otpResendTimestamp) {
    const diff = (now.getTime() - user.otpResendTimestamp.getTime()) / 1000; // seconds
    if (diff < 60) {
      throw new ApiError(429, `Please wait ${Math.ceil(60 - diff)} seconds before resending OTP`);
    }
  }

  // Generate new OTP if none or expired
  let otp: string;
  if (!user.emailOtp || (user.emailOtpExpiry && user.emailOtpExpiry < now)) {
    otp = generateOTP();
  } else {
    otp = user.emailOtp; 
    otp = generateOTP(); 
  }

  const hashedOtp = hashOTP(otp);

  // Update user OTP data
  user.emailOtp = hashedOtp;
  user.emailOtpExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 min expiry
  user.otpResendTimestamp = now;
  user.otpResendLimit = (user.otpResendLimit || 0) + 1;

  await user.save();

  try {
    await sendOTPEmail(email, otp); // send the plain OTP
  } catch (err) {
    throw new ApiError(500, "Failed to send OTP email");
  }

  return { message: "OTP resent successfully" };
}


}
