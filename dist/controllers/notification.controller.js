var _a;
import { NotificationService } from "../services/notification.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class NotificationController {
}
_a = NotificationController;
NotificationController.sendNotification = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
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
NotificationController.getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notifications = await NotificationService.getUserNotifications(userId);
    res.status(200).json({
        success: true,
        data: notifications,
    });
});
