import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginLimiter, registerLimiter, forgotPasswordLimiter, refreshTokenLimiter, resendOTPLimiter, } from "../middlewares/rate.middleware.js";
import { registerSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema, resendOTPSchema, verifyPhoneOTPSchema, submitBVNSchema, } from "../schemas/auth.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication related endpoints
 */
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       403:
 *         description: User already exists
 */
router.post("/register", registerLimiter, validate(registerSchema), AuthController.register);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful, returns access and refresh tokens
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginLimiter, validate(loginSchema), AuthController.login);
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Returns new access token
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh-token", refreshTokenLimiter, validate(refreshTokenSchema), AuthController.refreshToken);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset token via email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Token sent via email if user exists
 */
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       401:
 *         description: Invalid or expired token
 */
router.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);
/**
 * @swagger
 * /auth/verify-phone:
 *   post:
 *     summary: Verify phone number using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       401:
 *         description: Invalid or expired OTP
 */
router.post("/verify-phone", validate(verifyPhoneOTPSchema), AuthController.verifyPhoneOTP);
router.post("/resend-otp", resendOTPLimiter, validate(resendOTPSchema), AuthController.resendOTP);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user by invalidating refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authMiddleware, AuthController.logout);
/**
 * @swagger
 * /auth/submit-bvn:
 *   post:
 *     summary: Submit BVN, set transaction PIN and create SafeHaven wallet
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bvn, identityId, transactionPin]
 *             properties:
 *               bvn:
 *                 type: string
 *                 example: "22123456789"
 *               identityId:
 *                 type: string
 *                 example: "sh_identity_ref_123"
 *               transactionPin:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: SafeHaven wallet created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/submit-bvn", authMiddleware, validate(submitBVNSchema), AuthController.submitBVN);
export default router;
