import mongoose from "mongoose";
const BankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    bankCode: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
}, { timestamps: true });
export const BankAccount = mongoose.model("BankAccount", BankAccountSchema);
