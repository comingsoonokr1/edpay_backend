var _a;
import { NotificationService } from "../services/notification.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class NotificationController {
}
_a = NotificationController;
// Send a new notification
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
// Get all notifications for the user
NotificationController.getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notifications = await NotificationService.getUserNotifications(userId);
    res.status(200).json({
        success: true,
        data: notifications,
    });
});
// Get unread notifications only
NotificationController.getUnreadNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const unreadNotifications = await NotificationService.getUnreadNotifications(userId);
    res.status(200).json({
        success: true,
        data: unreadNotifications,
    });
});
// Mark all unread notifications as read
NotificationController.markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    await NotificationService.markAllAsRead(userId);
    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
    });
});
// Mark single notification as read by notification ID
NotificationController.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
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
