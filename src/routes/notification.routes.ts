import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  getUserNotificationsSchema,
  sendNotificationSchema,
} from "../schemas/notification.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications management
 */

router.use(authMiddleware);

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     summary: Send a notification to a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationRequest'
 *     responses:
 *       201:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: notif_123456
 *                 message:
 *                   type: string
 *                   example: Airtime purchase successful
 *       400:
 *         description: Invalid notification payload
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/send",
  validate(sendNotificationSchema),
  NotificationController.sendNotification
);

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f2a0c9b8a1e90012abcd34
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                     example: Payment Successful
 *                   message:
 *                     type: string
 *                     example: Your data purchase was successful
 *                   read:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get(
  "/:userId",
  validate(getUserNotificationsSchema),
  NotificationController.getUserNotifications
);

export default router;
