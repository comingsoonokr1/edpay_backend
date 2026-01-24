import mongoose from "mongoose";


export interface UserDocument extends mongoose.Document {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: "user" | "admin";

    phoneOtp?: string;
    phoneOtpExpiry?: Date;
    isPhoneVerified: boolean;

    refreshToken?: string | null;
    forgotPasswordToken?: string | null;
    forgotPasswordExpiry?: Date | null;

    otpResendTimestamp: Date | null;
    otpResendLimit: number;
}




const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },

    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },

    password: { type: String, required: true },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    phoneOtp: { type: String },
    phoneOtpExpiry: { type: Date },

    isPhoneVerified: {
        type: Boolean,
        default: false,
    },

    refreshToken: { type: String, default: null },

    forgotPasswordToken: { type: String, default: null },
    forgotPasswordExpiry: { type: Date, default: null },

    otpResendTimestamp: { type: Date, default: null },
    otpResendLimit: { type: Number, default: 0 },

}, { timestamps: true });


export const User = mongoose.model<UserDocument>("User", UserSchema);
