import { Notification } from "../model/Notification.model.js";
export class NotificationService {
    static async sendNotification(data) {
        // Later: integrate email / SMS providers
        return Notification.create({
            userId: data.userId,
            title: data.title,
            message: data.message,
            channel: data.channel || "in-app",
            isRead: false,
        });
    }
    static async getUserNotifications(userId) {
        return Notification.find({ userId }).sort({ createdAt: -1 });
    }
    static async getUnreadNotifications(userId) {
        return Notification.find({ userId, isRead: false }).sort({ createdAt: -1 });
    }
    // Mark all unread notifications for a user as read
    static async markAllAsRead(userId) {
        return Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }
    // Mark a single notification as read by notification ID
    static async markAsRead(notificationId) {
        return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
    }
}
