import mongoose from "mongoose";
const DataSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    serviceID: {
        type: String,
        required: true
    },
    planCode: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"], default: "pending"
    },
    meta: {
        type: mongoose.Schema.Types.Mixed
    },
}, { timestamps: true });
export const DataSubscription = mongoose.model("DataSubscription", DataSubscriptionSchema);
