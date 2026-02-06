// controllers/notification.controller.ts
import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

export class NotificationController {
  // Send a new notification
  static sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { title, message, channel } = req.body;

    const notification = await NotificationService.sendNotification({
      userId,
      title,
      message,
      channel,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  });

  // Get all notifications for the user
  static getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const notifications = await NotificationService.getUserNotifications(userId);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  });

  // Get unread notifications only
  static getUnreadNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const unreadNotifications = await NotificationService.getUnreadNotifications(userId);

    res.status(200).json({
      success: true,
      data: unreadNotifications,
    });
  });

  // Mark all unread notifications as read
  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  });

  // Mark single notification as read by notification ID
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const updatedNotification = await NotificationService.markAsRead(id);

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedNotification,
    });
  });
}
