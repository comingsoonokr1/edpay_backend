import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        index: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    phoneOtp: { type: String, select: false },
    phoneOtpExpiry: { type: Date },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
        default: null,
        select: false,
    },
    forgotPasswordToken: {
        type: String,
        default: null,
        select: false,
    },
    forgotPasswordExpiry: {
        type: Date,
        default: null,
    },
    otpResendTimestamp: {
        type: Date,
        default: null,
    },
    otpResendLimit: {
        type: Number,
        default: 0,
    },
    bvn: {
        type: String,
        trim: true,
        minlength: 11,
        maxlength: 11,
        sparse: true,
    },
    dateOfBirth: {
        type: Date,
    },
    transactionPin: {
        type: String,
    },
    isKycVerified: {
        type: Boolean,
        default: false,
    },
    safeHavenIdentityId: { type: String },
    safeHavenAccount: {
        accountNumber: { type: String },
        accountName: { type: String },
        bankCode: { type: String },
        accountReference: { type: String },
        createdAt: { type: Date },
    },
}, { timestamps: true });
/**
 *  Typed model
 */
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
