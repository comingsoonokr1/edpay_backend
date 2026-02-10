import express from "express";
import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import mongoose from "mongoose";
import { User } from "../model/User.model.js";
import { Notification } from "../model/Notification.model.js";
const router = express.Router();
router.post("/safehaven", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const payload = req.body.data;
        const paymentReference = payload.paymentReference || payload.reference;
        const type = (payload.type || "").toLowerCase(); // Inwards / Outwards
        const status = (payload.status || "").toLowerCase();
        const amount = payload.amount;
        const account = payload.account; // The receiving account ID or user mapping
        const creditAccountName = payload.creditAccountName;
        const creditAccountNumber = payload.creditAccountNumber;
        const debitAccountName = payload.debitAccountName;
        const debitAccountNumber = payload.debitAccountNumber;
        const narration = payload.narration;
        const provider = payload.provider;
        if (!paymentReference || !type || !status || !amount) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Find wallet for this account
        const user = await User.findOne({
            "safeHavenAccount.accountId": account,
        });
        const wallet = await Wallet.findOne({ userId: user?._id }).session(session);
        if (!wallet) {
            await session.abortTransaction();
            return res.status(404).json({ error: "Wallet not found" });
        }
        if (type === "inwards") {
            // Incoming transfer → create new transaction if not exists
            let transaction = await Transaction.findOne({ reference: paymentReference }).session(session);
            if (!transaction) {
                transaction = new Transaction({
                    userId: wallet.userId,
                    type: "credit",
                    wallet: wallet._id,
                    amount,
                    reference: paymentReference,
                    status: status === "completed" ? "success" : "pending",
                    source: "bank",
                    details: {
                        creditAccountName,
                        creditAccountNumber,
                        debitAccountName,
                        debitAccountNumber,
                        narration,
                        provider,
                    },
                });
            }
            else {
                // Update existing transaction status
                transaction.status = status === "completed" ? "success" : status;
            }
            // If completed, add to wallet balance
            if (status === "completed") {
                wallet.balance += amount;
                // Create notification for recipient
                await Notification.create([
                    {
                        userId: wallet.userId, // recipient of the incoming transfer
                        title: "Funds Received",
                        message: `You have received ₦${amount.toLocaleString()} from ${debitAccountName || debitAccountNumber}.`,
                        channel: "in-app",
                        isRead: false,
                        type: "transaction",
                        metadata: {
                            reference: paymentReference,
                            amount,
                            creditAccountName,
                            creditAccountNumber,
                            debitAccountName,
                            debitAccountNumber,
                            narration,
                            provider,
                        },
                    },
                ], { session });
            }
            await transaction.save({ session });
            await wallet.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ message: "Incoming transaction processed successfully" });
        }
        else if (type === "outwards") {
            // Outgoing transfer → find existing pending transaction
            const transaction = await Transaction.findOne({
                reference: paymentReference,
                status: "pending",
                wallet: wallet._id,
            }).session(session);
            if (!transaction) {
                await session.commitTransaction();
                return res.status(200).json({ message: "Outgoing transaction not found or already processed" });
            }
            if (status === "completed") {
                wallet.balance -= amount;
                transaction.status = "success";
            }
            else if (status === "failed" || status === "cancelled") {
                wallet.reservedBalance -= amount;
                transaction.status = "failed";
            }
            else {
                await session.commitTransaction();
                return res.status(200).json({ message: "Status pending or queued, no action taken" });
            }
            await wallet.save({ session });
            await transaction.save({ session });
            await session.commitTransaction();
            return res.status(200).json({ message: "Outgoing transaction updated successfully" });
        }
        else {
            await session.commitTransaction();
            return res.status(400).json({ error: "Unknown transaction type" });
        }
    }
    catch (error) {
        await session.abortTransaction();
        console.error("Webhook error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    finally {
        session.endSession();
    }
});
export default router;
