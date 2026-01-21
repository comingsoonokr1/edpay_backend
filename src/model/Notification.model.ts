import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        enum: ["email", "sms", "in-app"],
        default: "in-app",
    },
    isRead: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ["info", "alert", "transaction"], default: "info"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
}, { timestamps: true });

export const Notification = mongoose.model("Notification", NotificationSchema);
