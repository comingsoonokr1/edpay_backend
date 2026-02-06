import { Notification } from "../model/Notification.model.js";

export class NotificationService {
  static async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    channel?: "email" | "sms" | "in-app";
  }) {
    // Later: integrate email / SMS providers
    return Notification.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      channel: data.channel || "in-app",
      isRead: false,
    });
  }

  static async getUserNotifications(userId: string) {
    return Notification.find({ userId }).sort({ createdAt: -1 });
  }

  static async getUnreadNotifications(userId: string) {
  return Notification.find({ userId, isRead: false }).sort({ createdAt: -1 });
}

// Mark all unread notifications for a user as read
static async markAllAsRead(userId: string) {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
}

// Mark a single notification as read by notification ID
static async markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
}

}
