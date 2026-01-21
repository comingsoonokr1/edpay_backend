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
}
