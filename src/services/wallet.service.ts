import mongoose from "mongoose";
import { ApiError } from "../shared/errors/api.error";
import { Wallet } from "../model/Wallet.model";
import { Transaction } from "../model/Transaction.model";
import { stripe } from "../providers/stripe.provider";



export class WalletService {
  static async getBalance(userId: string) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    return wallet.balance;
  }

  static async getTransactions(userId: string) {
    return Transaction.find({ userId }).sort({ createdAt: -1 });
  }

  // Create Stripe PaymentIntent to fund wallet
  static async createStripePaymentIntent(userId: string, amount: number) {
    if (amount <= 0) throw new ApiError(401, "Invalid amount");

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd", // Change to your currency
      metadata: { userId },
    });

    // Save pending transaction with Stripe paymentIntent.id as reference
    await Transaction.create({
      userId,
      type: "fund",
      amount,
      reference: paymentIntent.id,
      status: "pending",
      source: "stripe",
    });

    return paymentIntent.client_secret;
  }

  // Confirm Stripe payment and update wallet balance
  static async confirmStripePayment(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment not successful");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({ reference: paymentIntentId }).session(session);
      if (!transaction) throw new ApiError(404, "Transaction not found");
      if (transaction.status === "success") {
        await session.commitTransaction();
        session.endSession();
        return transaction;
      }

      transaction.status = "success";
      await transaction.save();

      const wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);
      if (!wallet) throw new ApiError(404, "Wallet not found");

      wallet.balance += transaction.amount;
      await wallet.save();

      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Withdraw method unchanged
  static async withdraw(userId: string, amount: number) {
    if (amount <= 0) throw new ApiError(401, "Invalid amount");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await Wallet.findOne({ userId }).session(session);
      if (!wallet) throw new ApiError(404, "Wallet not found");
      if (wallet.balance < amount) throw new ApiError(403, "Insufficient funds");

      wallet.balance -= amount;
      await wallet.save();

      await Transaction.create(
        [
          {
            userId,
            type: "debit",
            amount,
            reference: `withdraw_${Date.now()}`,
            status: "success",
            source: "wallet",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return wallet.balance;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // Transfer method unchanged
  static async transfer(senderId: string, receiverEmail: string, amount: number) {
    if (amount <= 0) throw new ApiError(401, "Invalid amount");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
      if (!senderWallet) throw new ApiError(404, "Sender wallet not found");
      if (senderWallet.balance < amount) throw new ApiError(403, "Insufficient funds");

      const receiverWallet = await Wallet.findOne({}).populate({
        path: "userId",
        match: { email: receiverEmail },
      }).session(session);

      if (!receiverWallet || !receiverWallet.userId) throw new ApiError(404, "Receiver not found");

      senderWallet.balance -= amount;
      receiverWallet.balance += amount;

      await senderWallet.save();
      await receiverWallet.save();

      await Transaction.create(
        [
          {
            userId: senderId,
            type: "debit",
            amount,
            reference: `transfer_${Date.now()}`,
            status: "success",
            source: "wallet",
            details: { to: receiverEmail },
          },
          {
            userId: receiverWallet.userId._id,
            type: "credit",
            amount,
            reference: `transfer_${Date.now()}`,
            status: "success",
            source: "wallet",
            details: { from: senderId },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return senderWallet.balance;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
