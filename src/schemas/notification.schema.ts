import { z } from "zod";

export const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
    channel: z.enum(["email", "sms", "in-app"]).optional(),
  }),
});

export const getUserNotificationsSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
  }),
});
