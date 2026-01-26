import { User } from "../model/User.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper.js";
import crypto from "crypto";
import { TokenService } from "./token.service.js";
import { Wallet } from "../model/Wallet.model.js";
import mongoose from "mongoose";
import { firebaseAdmin } from "../shared/utils/firebase.config.js";

export class AuthService {
  static async register(
    fullName: string,
    email: string,
    password: string,
    phoneNumber: string
  ) {
    const exists = await User.findOne({ phoneNumber });
    if (exists) throw new ApiError(403, "User already exists");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hashedPassword = await hashPassword(password);

      // OTP logic—client will handle Firebase verification after register

      const user = await User.create(
        [
          {
            fullName,
            email,
            password: hashedPassword,
            phoneNumber,
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
    const user = await User.findOne({ phoneNumber });
    if (!user) throw new ApiError(404, "User not found");
    

    try {
      // Verify the ID token using Firebase Admin
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

      // Ensure the phone number in the token matches the user's (Firebase includes '+')
      const expectedPhone = `+${phoneNumber.startsWith('234') ? phoneNumber : '234' + phoneNumber}`;
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
  }
}
