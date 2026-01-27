var _a;
import { AuthService } from "../services/auth.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class AuthController {
    static async submitBVN(req, res) {
        const { bvn, identityId, transactionPin } = req.body;
        const userId = req.user.userId;
        const result = await AuthService.submitBVNAndCreateWallet(userId, bvn, identityId, transactionPin);
        return res.status(200).json(result);
    }
}
_a = AuthController;
AuthController.register = asyncHandler(async (req, res) => {
    const { fullName, email, password, phoneNumber } = req.body;
    await AuthService.register(fullName, email, password, phoneNumber);
    res.status(201).json({
        success: true,
        message: "User registered successfully, OTP sent to phone number",
    });
});
AuthController.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const tokens = await AuthService.login(email, password);
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: tokens,
    });
});
AuthController.logout = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    await AuthService.logout(userId);
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});
AuthController.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const accessToken = await AuthService.refreshToken(refreshToken);
    res.status(200).json({
        success: true,
        data: { accessToken, refreshToken },
    });
});
AuthController.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const token = await AuthService.forgotPassword(email);
    res.status(200).json({
        success: true,
        message: "Password reset token sent",
        token, // remove this in production, send via email
    });
});
AuthController.resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    res.status(200).json({
        success: true,
        message: "Password reset successful",
    });
});
AuthController.verifyPhoneOTP = asyncHandler(async (req, res) => {
    const { phoneNumber, otp } = req.body;
    await AuthService.verifyPhoneOTP(phoneNumber, otp);
    res.json({
        success: true,
        message: "Phone number verified successfully",
    });
});
AuthController.resendOTP = asyncHandler(async (req, res, next) => {
    try {
        const { phoneNumber } = req.body;
        const result = await AuthService.resendOTP(phoneNumber);
        res.json({
            success: true,
            message: "OTP resent successfully",
        });
    }
    catch (err) {
        next(err);
    }
});
