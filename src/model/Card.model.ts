import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    cardBrand: { 
        type: String, 
        required: true 
    }, // Visa, MasterCard
    last4: { 
        type: String, 
        required: true 
    },
    token: { 
        type: String, 
        required: true 
    }, // Token from payment gateway
    expiryMonth: { 
        type: Number, 
        required: true 
    },
    expiryYear: { 
        type: Number, 
        required: true 
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });

export const Card = mongoose.model("Card", CardSchema);
