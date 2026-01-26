import { User } from "../model/User.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper.js";
import crypto from "crypto";
import { TokenService } from "./token.service.js";
import { Wallet } from "../model/Wallet.model.js";
import mongoose from "mongoose";
import { firebaseAdmin } from "../shared/utils/firebase.config.js";

export class AuthService {
  // Re-add validation for consistency (adjust regex if needed)
  private static validateAndFormatPhone(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace("+", "");
    const nigerianFormatRegex = /^[1-9]\d{10,14}$/; // No '+' at the start

    if (!nigerianFormatRegex.test(cleanPhone)) {
      throw new ApiError(
        400,
        "Invalid phone format. Use international format without '+' (e.g., 2348012345678)"
      );
 
      await Wallet.create(
        [
          {
            userId: user[0]._id,
            balance: 0,
            reservedBalance: 0,
            currency: "NGN",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return user[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return cleanPhone;
  }

  static async register(
    fullName: string,
    email: string,
    password: string,
    phoneNumber: string
  ) {
    const formattedPhone = this.validateAndFormatPhone(phoneNumber);
    const exists = await User.findOne({ phoneNumber: formattedPhone });
    if (exists) throw new ApiError(403, "User already exists");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hashedPassword = await hashPassword(password);

      // Removed custom OTP logic—client will handle Firebase verification after register

      const user = await User.create(
        [
          {
            fullName,
            email,
            password: hashedPassword,
            phoneNumber: formattedPhone,
            isPhoneVerified: false,
          },
        ],
        { session }
      );

      await Wallet.create(
        [
          {
            userId: user[0]._id,
            balance: 0,
            reservedBalance: 0,
            currency: "NGN",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return user[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }


  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new ApiError(401, "Invalid credentials");

    if (!user.isPhoneVerified) {
      // Signal client to initiate verification (no backend resend needed)
      throw new ApiError(403, JSON.stringify({
        code: "PHONE_NOT_VERIFIED",
        phoneNumber: user.phoneNumber,
      }));
    }

    const userId = user._id.toString();

    const accessToken = TokenService.generateAccessToken({ userId, role: user.role });

    const refreshToken = TokenService.generateRefreshToken(userId);

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

    const userId = user._id.toString();

    const accessToken = TokenService.generateAccessToken({
      userId,
      role: user.role,
    });

    const newRefreshToken = TokenService.generateRefreshToken(userId);

    // ROTATE refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
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

  static async verifyPhone(phoneNumber: string, idToken: string) {
    const formattedPhone = this.validateAndFormatPhone(phoneNumber);
    const user = await User.findOne({ phoneNumber: formattedPhone });
    if (!user) throw new ApiError(404, "User not found");

    try {
      // Verify the ID token using Firebase Admin
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

      // Ensure the phone number in the token matches the user's (Firebase includes '+')
      const expectedPhone = `+${formattedPhone.startsWith('234') ? formattedPhone : '234' + formattedPhone}`;
      if (decodedToken.phone_number !== expectedPhone) {
        throw new ApiError(400, "Phone number mismatch");
      }

      user.isPhoneVerified = true;
      // Remove any legacy OTP fields if they exist
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;

      await user.save();

      return { message: "Phone number verified successfully" };
    } catch (error) {
      console.error("Firebase verification error:", error);
      throw new ApiError(401, "Invalid or expired verification token");
    }

    /** ================= COOLDOWN ================= */
    if (user.otpResendTimestamp) {
      const diffSeconds =
        (now.getTime() - user.otpResendTimestamp.getTime()) / 1000;

      if (diffSeconds < 60) {
        throw new ApiError(
          429,
          `Please wait ${Math.ceil(60 - diffSeconds)} seconds before resending OTP`
        );
      }
    }

    /** ================= GENERATE NEW OTP ================= */
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);

    /** ================= UPDATE USER ================= */
    user.phoneOtp = hashedOtp;
    user.phoneOtpExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins
    user.otpResendTimestamp = now;
    user.otpResendLimit = (user.otpResendLimit || 0) + 1;

    await user.save();

    /** ================= SEND SMS ================= */
    try {
      await sendOTPSMS(formattedPhone, otp);
    } catch (error) {
      console.error("OTP SMS resend failed:", error);
      throw new ApiError(500, "Failed to resend OTP");
    }

    return {
      message: "OTP resent successfully",
    };
  }
}
