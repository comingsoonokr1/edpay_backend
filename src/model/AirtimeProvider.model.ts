import mongoose from "mongoose";

const AirtimeProviderSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    providerCode: {
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
}, { timestamps: true });

export const AirtimeProvider = mongoose.model("AirtimeProvider", AirtimeProviderSchema);
