import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { changePasswordSchema, updateProfileSchema, } from "../schemas/user.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and account management
 */
router.use(authMiddleware);
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                   example: John Doe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *                 phone:
 *                   type: string
 *                   example: "08031234567"
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", UserController.getProfile);
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fullName:
 *                   type: string
 *                   example: John Doe
 *                 phone:
 *                   type: string
 *                   example: "08031234567"
 *       400:
 *         description: Invalid profile data
 *       401:
 *         description: Unauthorized
 */
router.put("/profile", validate(updateProfileSchema), UserController.updateProfile);
/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change account password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password data
 *       401:
 *         description: Unauthorized
 */
router.put("/change-password", validate(changePasswordSchema), UserController.changePassword);
export default router;
