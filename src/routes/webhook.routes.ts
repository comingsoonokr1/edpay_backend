import express from "express";
import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/safehaven", async (req, res) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = req.body;

    const payload = request.data;

    // Example: extract transfer paymentReference and status
    // Adjust according to SafeHaven webhook payload docs
    const paymentReference = payload.paymentReference || payload.reference;
    const status = (payload.status || "").toLowerCase();

    if (!paymentReference || !status) {
      return res.status(400).json({ error: "Missing paymentReference or status" });
    }

    // Find the transaction that matches this paymentReference and is pending
    const transaction = await Transaction.findOne({
      reference: paymentReference,
      status: "pending",
    }).session(session);

    if (!transaction) {
      // If no pending transaction found, maybe it’s already handled, just acknowledge
      await session.commitTransaction();
      return res.status(200).json({ message: "Transaction not found or already processed" });
    }

    // Fetch wallet for transaction user
    const wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (status === "completed") {
      // Funds reserved earlier should now be deducted permanently
      wallet.reservedBalance -= transaction.amount;
      wallet.balance -= transaction.amount;
      transaction.status = "success";

    } else if (status === "failed" || status === "cancelled") {
      // Release reserved funds since transfer failed
      wallet.reservedBalance -= transaction.amount;
      transaction.status = "failed";
    } else {
      // Other statuses (queued, pending) - do nothing or log
      await session.commitTransaction();
      return res.status(200).json({ message: "Status pending or queued, no action taken" });
    }

    await wallet.save({ session });
    await transaction.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ message: "Transaction updated successfully" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    session.endSession();
  }
});

export default router;
