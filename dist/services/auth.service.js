import { User } from "../model/User.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper.js";
import crypto from "crypto";
import { TokenService } from "./token.service.js";
<<<<<<< HEAD
import { Wallet } from "../model/Wallet.model.js";
import mongoose from "mongoose";
import { firebaseAdmin } from "../shared/utils/firebase.config.js";
export class AuthService {
    // Re-add validation for consistency (adjust regex if needed)
=======
import { generateOTP, hashOTP } from "../shared/helpers/otp.helpers.js";
import { Wallet } from "../model/Wallet.model.js";
import mongoose from "mongoose";
import { sendOTPSMS } from "../shared/helpers/otp.helper.js";
export class AuthService {
    // Inside AuthService.ts
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
    static validateAndFormatPhone(phoneNumber) {
        const cleanPhone = phoneNumber.replace(/\s+/g, "").replace("+", "");
        const nigerianFormatRegex = /^[1-9]\d{10,14}$/; // No '+' at the start
        if (!nigerianFormatRegex.test(cleanPhone)) {
            throw new ApiError(400, "Invalid phone format. Use international format without '+' (e.g., 2348012345678)");
        }
        return cleanPhone;
    }
    static async register(fullName, email, password, phoneNumber) {
        const formattedPhone = this.validateAndFormatPhone(phoneNumber);
<<<<<<< HEAD
        const exists = await User.findOne({ phoneNumber: formattedPhone });
=======
        const exists = await User.findOne({ phoneNumber });
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
        if (exists)
            throw new ApiError(403, "User already exists");
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const hashedPassword = await hashPassword(password);
<<<<<<< HEAD
            // Removed custom OTP logic—client will handle Firebase verification after register
=======
            const otp = generateOTP();
            const hashedOtp = hashOTP(otp);
            // try {
            //   await sendOTPSMS(phoneNumber, otp);
            // } catch (error) {
            //   console.error("SMS OTP failed:", error);
            //   throw new ApiError(500, "Unable to send OTP SMS");
            // }
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
            const user = await User.create([
                {
                    fullName,
                    email,
                    password: hashedPassword,
                    phoneNumber: formattedPhone,
<<<<<<< HEAD
=======
                    phoneOtp: hashedOtp,
                    phoneOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
                    isPhoneVerified: false,
                },
            ], { session });
            await Wallet.create([
                {
                    userId: user[0]._id,
                    balance: 0,
                    reservedBalance: 0,
                    currency: "NGN",
                },
            ], { session });
            await session.commitTransaction();
            return user[0];
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async login(email, password) {
        const user = await User.findOne({ email });
        if (!user)
            throw new ApiError(401, "Invalid credentials");
        const isValid = await comparePassword(password, user.password);
        if (!isValid)
            throw new ApiError(401, "Invalid credentials");
<<<<<<< HEAD
        if (!user.isPhoneVerified) {
            // Signal client to initiate verification (no backend resend needed)
            throw new ApiError(403, JSON.stringify({
                code: "PHONE_NOT_VERIFIED",
                phoneNumber: user.phoneNumber,
            }));
        }
=======
        //    if (!user.isPhoneVerified) {
        //   //  Re-send OTP safely (rate-limited inside)
        //   await AuthService.resendOTP(user.phoneNumber);
        //   // Stop login flow here
        //   throw new ApiError(403, JSON.stringify({
        //   code: "PHONE_NOT_VERIFIED",
        //   phoneNumber: user.phoneNumber,
        // }));
        // }
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
        const userId = user._id.toString();
        const accessToken = TokenService.generateAccessToken({ userId, role: user.role });
        const refreshToken = TokenService.generateRefreshToken(userId);
        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken };
    }
    static async logout(userId) {
        const user = await User.findById(userId);
        if (!user)
            throw new ApiError(404, "User not found");
        user.refreshToken = null;
        await user.save();
    }
    static async refreshToken(refreshToken) {
        const user = await User.findOne({ refreshToken });
        if (!user)
            throw new ApiError(401, "Invalid refresh token");
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
    static async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user)
            throw new ApiError(404, "User not found");
        // Generate token (can use crypto or UUID)
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour from now
        user.forgotPasswordToken = token;
        user.forgotPasswordExpiry = expiry;
        await user.save();
        // Send token via email service here (outside service responsibility)
        return token;
    }
    static async resetPassword(token, newPassword) {
        const user = await User.findOne({
            forgotPasswordToken: token,
            forgotPasswordExpiry: { $gt: new Date() },
        });
        if (!user)
            throw new ApiError(401, "Invalid or expired token");
        user.password = await hashPassword(newPassword);
        user.forgotPasswordToken = null;
        user.forgotPasswordExpiry = null;
        await user.save();
    }
<<<<<<< HEAD
    static async verifyPhone(phoneNumber, idToken) {
        const formattedPhone = this.validateAndFormatPhone(phoneNumber);
        const user = await User.findOne({ phoneNumber: formattedPhone });
        if (!user)
            throw new ApiError(404, "User not found");
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
        }
        catch (error) {
            console.error("Firebase verification error:", error);
            throw new ApiError(401, "Invalid or expired verification token");
        }
=======
    static async verifyPhoneOTP(phoneNumber, otp) {
        const user = await User.findOne({ phoneNumber });
        if (!user)
            throw new ApiError(404, "User not found");
        if (!user.phoneOtp || !user.phoneOtpExpiry)
            throw new ApiError(400, "No OTP found");
        if (user.phoneOtpExpiry < new Date())
            throw new ApiError(400, "OTP expired");
        const hashedOtp = hashOTP(otp);
        if (hashedOtp !== user.phoneOtp)
            throw new ApiError(400, "Invalid OTP");
        user.isPhoneVerified = true;
        user.phoneOtp = undefined;
        user.phoneOtpExpiry = undefined;
        await user.save();
        return { message: "Phone number verified successfully" };
    }
    static async resendOTP(phoneNumber) {
        const formattedPhone = this.validateAndFormatPhone(phoneNumber);
        const user = await User.findOne({ phoneNumber: formattedPhone });
        if (!user)
            throw new ApiError(404, "User not found");
        const now = new Date();
        /** ================= RATE LIMIT ================= */
        if (user.otpResendLimit && user.otpResendLimit >= 5) {
            throw new ApiError(429, "Maximum OTP resend attempts reached");
        }
        /** ================= COOLDOWN ================= */
        if (user.otpResendTimestamp) {
            const diffSeconds = (now.getTime() - user.otpResendTimestamp.getTime()) / 1000;
            if (diffSeconds < 60) {
                throw new ApiError(429, `Please wait ${Math.ceil(60 - diffSeconds)} seconds before resending OTP`);
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
        }
        catch (error) {
            console.error("OTP SMS resend failed:", error);
            throw new ApiError(500, "Failed to resend OTP");
        }
        return {
            message: "OTP resent successfully",
        };
>>>>>>> f6806fc49d2d7a49e2924cdf0dafcb8929dac3f7
    }
}
