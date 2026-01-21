import mongoose from "mongoose";

const BillPaymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  providerId: { 
    type: mongoose.Types.ObjectId, 
    ref: "BillProvider", 
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
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  },
}, { timestamps: true });

export const BillPayment = mongoose.model("BillPayment", BillPaymentSchema);
