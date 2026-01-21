import mongoose from "mongoose";
const PaymentLinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "NGN"
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
}, { timestamps: true });
export const PaymentLink = mongoose.model("PaymentLink", PaymentLinkSchema);
