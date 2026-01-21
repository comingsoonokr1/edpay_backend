import { model, Schema, Types } from "mongoose";

const PaymentSchema = new Schema({
    userId: { 
        type: Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    transactionId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "success", "failed"], default: "pending" 
    },
    paymentMethod: { 
        type: String, 
        enum: ["card", "bank", "wallet", "payment-link"], 
        required: true 
    },
    metadata: { 
        type: Schema.Types.Mixed
     },
}, { timestamps: true });

export const Payment = model("Payment", PaymentSchema);
