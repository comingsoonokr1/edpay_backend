import mongoose, { model, Schema } from "mongoose";

const TransactionSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User", required: true
    },
    wallet: {
        type: mongoose.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },

    type: {
        type: String,
        enum: ["credit", "debit"],
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
        enum: ["pending", "success", "failed"],
        default: "pending"
    },
    source: {
        type: String,
        enum: ["wallet", "bank", "card", "airtime", "data", "bills", "checkout"],
        required: true
    },
    isInternal: {
        type: Boolean,
        default: false
    },
    details: { type: mongoose.Schema.Types.Mixed },

    channel: {
        type: String,
        enum: ["card", "bank", "wallet"],
    },

    meta: {
        type: Schema.Types.Mixed,
    }, // Extra info like transaction metadata
}, { timestamps: true });

export const Transaction = model("Transaction", TransactionSchema);
