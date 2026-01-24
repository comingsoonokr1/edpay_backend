import mongoose from "mongoose";
import { ApiError } from "../shared/errors/api.error.js";
import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import { stripe } from "../providers/stripe.provider.js";
import { PaystackTransferProvider } from "../providers/paystackTransaferProvider.js";
import { User } from "../model/User.model.js";




export class WalletService {

   static async createWallet(userId: mongoose.Types.ObjectId) {
    return Wallet.create({
      userId,
      balance: 0,
      reservedBalance: 0,
      currency: "NGN",
    });
  }
  
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
 static async transfer({
  senderId,
  method,
  recipient,
  amount,
  bank,
  accountNumber,
}: {
  senderId: string;
  method: "user" | "bank";
  recipient: string;
  amount: number;
  bank?: string;
  accountNumber?: string;
}) {
  if (amount <= 0) throw new ApiError(400, "Invalid amount");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /** Sender Wallet */
    const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
    if (!senderWallet) throw new ApiError(404, "Sender wallet not found");

    const availableBalance =
      senderWallet.balance - (senderWallet.reservedBalance || 0);

    if (availableBalance < amount)
      throw new ApiError(403, "Insufficient balance");

    /** ================= INTERNAL TRANSFER ================= */
    if (method === "user") {
      const user = await User.findOne({ phoneNumber: recipient }).session(session);
      if (!user) throw new ApiError(404, "Recipient not found");

      const receiverWallet = await Wallet.findOne({ userId: user._id }).session(session);
      if (!receiverWallet) throw new ApiError(404, "Recipient wallet not found");

      senderWallet.balance -= amount;
      receiverWallet.balance += amount;

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      const reference = `TRF_${Date.now()}`;

      await Transaction.create(
        [
          {
            userId: senderId,
            type: "debit",
            amount,
            reference,
            status: "success",
            source: "wallet",
            details: { to: recipient },
          },
          {
            userId: receiverWallet.userId,
            type: "credit",
            amount,
            reference,
            status: "success",
            source: "wallet",
            details: { from: senderId },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return {
        message: "Transfer successful",
        balance: senderWallet.balance,
      };
    }

    /** ================= BANK TRANSFER ================= */
    if (method === "bank") {
      if (!bank || !accountNumber)
        throw new ApiError(400, "Bank and account number required");

      // LOCK FUNDS
      senderWallet.reservedBalance += amount;
      await senderWallet.save({ session });

      const recipientCode = await PaystackTransferProvider.createRecipient(
        "EdPay User",
        accountNumber,
        bank
      );

      const transfer = await PaystackTransferProvider.initiateTransfer(
        recipientCode,
        amount,
        "EdPay Wallet Transfer"
      );

      await Transaction.create(
        [
          {
            userId: senderId,
            type: "debit",
            amount,
            reference: transfer.transfer_code,
            status: "pending",
            source: "bank",
            details: { bank, accountNumber, recipientCode },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      return {
        message: "Bank transfer initiated",
        transferCode: transfer.transfer_code,
        balance: senderWallet.balance - senderWallet.reservedBalance,
      };
    }

    throw new ApiError(400, "Invalid transfer method");
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}


}
