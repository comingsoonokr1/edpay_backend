// controllers/notification.controller.ts
import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";


export class NotificationController {
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

  static getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const notifications = await NotificationService.getUserNotifications(userId);

    res.status(200).json({
      success: true,
      data: notifications,
    });
  });
}
