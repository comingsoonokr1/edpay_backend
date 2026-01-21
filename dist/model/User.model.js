import mongoose from "mongoose";
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
export const User = mongoose.model("User", UserSchema);
