import { User } from "../model/User.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper.js";
import crypto from "crypto";
import { TokenService } from "./token.service.js";
import { generateOTP, hashOTP } from "../shared/helpers/otp.helpers.js";
import { Wallet } from "../model/Wallet.model.js";
import mongoose from "mongoose";
import { sendOTPSMS } from "../shared/helpers/otp.helper.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";


export class AuthService {
  private static validateAndFormatPhone(phoneNumber: string): string {
    let cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/^\+/, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = "234" + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("234")) {
      cleanPhone = "234" + cleanPhone;
    }

    const nigerianFormatRegex = /^234[789]\d{9}$/;
    if (!nigerianFormatRegex.test(cleanPhone)) {
      throw new ApiError(
        400,
        "Invalid phone format. Use Nigerian international format without '+' (e.g., 2348012345678)"
      );
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
    const emailExists = await User.findOne({ email });
    if (exists) throw new ApiError(403, "User already exists");
    if (emailExists) throw new ApiError(403, "Email already exists");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hashedPassword = await hashPassword(password);
      const otp = generateOTP();  
      const hashedOtp = hashOTP(otp);

      await sendOTPSMS(formattedPhone, otp);

      const userDoc = {
        fullName,
        email,
        password: hashedPassword,
        phoneNumber: formattedPhone,
        phoneOtp: hashedOtp,
        phoneOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        isPhoneVerified: false,
      };

      const user = await User.create([userDoc], { session });

      await Wallet.create(
        [{
          userId: user[0]._id,
          balance: 0,
          reservedBalance: 0,
          currency: "NGN",
        }],
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
      await AuthService.resendOTP(user.phoneNumber);
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

    // Determine onboarding state
    const onboarding = {
      hasWallet: !!user.safeHavenAccount?.accountNumber,
      hasSubmittedBVN: !!user.bvn && !!user.safeHavenIdentityId,
      hasTransactionPin: !!user.transactionPin,
      isKycVerified: user.isKycVerified,
    };

    return { accessToken, refreshToken, onboarding };
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
    const accessToken = TokenService.generateAccessToken({ userId, role: user.role });
    const newRefreshToken = TokenService.generateRefreshToken(userId);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    user.forgotPasswordToken = token;
    user.forgotPasswordExpiry = expiry;
    await user.save();

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

  static async verifyPhoneOTP(phoneNumber: string, otp: string) {
    const formattedPhone = this.validateAndFormatPhone(phoneNumber);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findOne({ phoneNumber: formattedPhone }).select("+phoneOtp").session(session);
      if (!user) throw new ApiError(404, "User not found");

      if (!user.phoneOtp || !user.phoneOtpExpiry) {
        throw new ApiError(400, "No OTP found");
      }

      if (user.phoneOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP expired");
      }

      if (hashOTP(otp) !== user.phoneOtp) {
        throw new ApiError(400, "Invalid OTP");
      }

      // Mark phone as verified
      user.isPhoneVerified = true;
      user.phoneOtp = undefined;
      user.phoneOtpExpiry = undefined;

      await user.save({ session });
      await session.commitTransaction();

      return {
        message: "Phone number verified successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }



  static async resendOTP(phoneNumber: string) {
    const formattedPhone = this.validateAndFormatPhone(phoneNumber);
    const user = await User.findOne({ phoneNumber: formattedPhone });
    if (!user) throw new ApiError(404, "User not found");

    const now = new Date();

    if (user.otpResendLimit && user.otpResendLimit >= 5) {
      throw new ApiError(429, "Maximum OTP resend attempts reached");
    }

    if (user.otpResendTimestamp) {
      const diffSeconds = (now.getTime() - user.otpResendTimestamp.getTime()) / 1000;
      if (diffSeconds < 60) {
        throw new ApiError(
          429,
          `Please wait ${Math.ceil(60 - diffSeconds)} seconds before resending OTP`
        );
      }
    }

    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);

    user.phoneOtp = hashedOtp;
    user.phoneOtpExpiry = new Date(now.getTime() + 10 * 60 * 1000);
    user.otpResendTimestamp = now;
    user.otpResendLimit = (user.otpResendLimit || 0) + 1;

    await user.save();

    try {
      await sendOTPSMS(formattedPhone, otp);
    } catch (error) {
      console.error("OTP SMS resend failed:", error);
      throw new ApiError(500, "Failed to resend OTP");
    }

    return { message: "OTP resent successfully" };
  }


static async initiateBVN(userId: string, nin: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!/^\d{11}$/.test(nin)) {
    throw new ApiError(400, "BVN must be 11 digits");
  }

  const identity = await SafeHavenProvider.initiateVerification({
    type: "NIN",
    number: nin,
    debitAccountNumber: "0116763095"
  });

   user.bvn = nin;
   await user.save();

  return {
    message: "OTP sent to BVN registered phone number",
    identityId: identity.data._id, // IMPORTANT
  };
}


static async validateBVNAndCreateWallet(
  userId: string,
  identityId: string,
  otp: string,
  transactionPin: string
) {
  if (!/^\d{4}$/.test(transactionPin)) {
    throw new ApiError(400, "Transaction PIN must be 4 digits");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /**
     *  Validate OTP
     */
    const verification = await SafeHavenProvider.validateVerification({
      identityId,
      type: "NIN",
      otp,
    });

    console.log(verification);

    if (verification.statusCode !== "200" && verification.message !== "OTP already verified.") {
      throw new ApiError(400, "BVN verification failed");
    }

    /**
     *  Save KYC data
     */
   
    user.safeHavenIdentityId = identityId;
    user.isKycVerified = true;
    user.transactionPin = await hashPassword(transactionPin);

    /**
     * 3Create Wallet
     */
    if (!user.safeHavenAccount?.accountNumber) {
      const account = await SafeHavenProvider.createSubAccount({
        phone: user.phoneNumber,
        email: user.email,
        externalReference: user._id.toString(),
        identityType: "BVN",
        identityNumber: user.bvn!,
        identityId,
        otp
      });
      
  
      user.safeHavenAccount = {
        accountId: account._id,
        accountNumber: account.accountNumber,
        accountName: account.accountName || user.fullName,
        bankCode: account.bankCode,
        accountReference: account.externalreference || account._id,
        createdAt: new Date(),
      };
    }

    await user.save({ session });
    await session.commitTransaction();

    return {
      message: "BVN verified and wallet created successfully",
      wallet: user.safeHavenAccount,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}



}
