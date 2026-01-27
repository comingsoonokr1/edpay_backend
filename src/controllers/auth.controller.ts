import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";


export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, password, phoneNumber } = req.body;

    await AuthService.register(fullName, email, password, phoneNumber);

    res.status(201).json({
      success: true,
      message: "User registered successfully, OTP sent to phone number",
    });
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const tokens = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: tokens,
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    await AuthService.logout(userId!);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const accessToken = await AuthService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken },
    });
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const token = await AuthService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: "Password reset token sent",
      token, // remove this in production, send via email
    });
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    await AuthService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  });

  static verifyPhoneOTP = asyncHandler(async (req: Request, res: Response) => {
    const { phoneNumber, otp } = req.body;

    await AuthService.verifyPhoneOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: "Phone number verified successfully",
    });
  });

  static resendOTP = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber } = req.body;
      const result = await AuthService.resendOTP(phoneNumber);
      res.json({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (err) {
      next(err);
    }
  });

 
static initiateBVN = asyncHandler(async (req: Request, res: Response) => {
  const { bvn } = req.body;
  const userId = req.user!.userId;

  if (!bvn) {
    throw new ApiError(400, "BVN is required");
  }

  const result = await AuthService.initiateBVN(userId, bvn);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      identityId: result.identityId,
    },
  });
});

static validateBVN = asyncHandler(async (req: Request, res: Response) => {
  const { identityId, otp, transactionPin } = req.body;
  const userId = req.user!.userId;

  if (!identityId || !otp || !transactionPin) {
    throw new ApiError(400, "identityId, otp, and transactionPin are required");
  }

  const result = await AuthService.validateBVNAndCreateWallet(
    userId,
    identityId,
    otp,
    transactionPin
  );

  res.status(200).json({
    success: true,
    message: result.message,
    data: result.wallet,
  });
});


}
