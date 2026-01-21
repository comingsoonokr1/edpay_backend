import mongoose from "mongoose";
const BillProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        enum: ["electricity", "water", "tv", "internet"],
        required: true
    },
    providerCode: {
        type: String,
        required: true
    }, // ID from external API
}, { timestamps: true });
export const BillProvider = mongoose.model("BillProvider", BillProviderSchema);
