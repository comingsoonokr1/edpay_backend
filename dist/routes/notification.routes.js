import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sendNotificationSchema, } from "../schemas/notification.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
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
router.post("/send", validate(sendNotificationSchema), NotificationController.sendNotification);
/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
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
 *                   isRead:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", NotificationController.getUserNotifications);
/**
 * @swagger
 * /notifications/unread:
 *   get:
 *     summary: Get unread notifications for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unread notifications
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
 *                   message:
 *                     type: string
 *                   isRead:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/unread", NotificationController.getUnreadNotifications);
/**
 * @swagger
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read for the logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch("/mark-all-read", NotificationController.markAllAsRead);
/**
 * @swagger
 * /notifications/{id}/mark-read:
 *   patch:
 *     summary: Mark a single notification as read by notification ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: notif_123456
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 message:
 *                   type: string
 *                 isRead:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/mark-read", NotificationController.markAsRead);
export default router;
