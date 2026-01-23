import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    balance: { 
        type: Number, 
        default: 0 
    },
    reservedBalance: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    currency: { 
        type: String, 
        default: "NGN" 
    },
}, { timestamps: true });

export const Wallet = mongoose.model("Wallet", WalletSchema);
