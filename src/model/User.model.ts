import mongoose from "mongoose";


export interface UserDocument extends mongoose.Document {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: "user" | "admin";
    refreshToken?: string | null;
    emailOtp?: string;
    emailOtpExpiry?: Date;
    isEmailVerified: boolean;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
    forgotPasswordToken?: string | null;
    forgotPasswordExpiry?: Date | null;
    otpResendTimestamp: Date | null;  // track last resend time
    otpResendLimit: number;
}



const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    emailOtp: {
        type: String
    },
    emailOtpExpiry: {
        type: Date,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    forgotPasswordToken: {
        type: String,
        default: null
    },
    forgotPasswordExpiry: {
        type: Date,
        default: null
    },
    otpResendTimestamp: {
        type: Date,
        default: null,
    },
    otpResendLimit: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export const User = mongoose.model<UserDocument>("User", UserSchema);
