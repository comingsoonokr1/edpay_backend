import mongoose from "mongoose";
import { Transaction } from "../model/Transaction.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
import { Wallet } from "../model/Wallet.model.js";

export class CheckoutService {
  static async verifyCheckout(reference: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Check if transaction already exists (idempotency)
      const existingTx = await Transaction.findOne({ reference }).session(session);
      if (existingTx) {
        await session.commitTransaction();
        return existingTx;
      }

      // 2️⃣ Verify payment with SafeHaven
      const verification = await SafeHavenProvider.verifyCheckout(reference);

      if (!verification?.data) {
        throw new ApiError(400, "Invalid verification response");
      }

      const payment = verification.data;

      if (payment.status !== "success") {
        throw new ApiError(400, "Payment not successful");
      }

      const amount = Number(payment.amount);
      if (amount <= 0) {
        throw new ApiError(400, "Invalid payment amount");
      }

      // 3️⃣ Get wallet
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        throw new ApiError(404, "Wallet not found");
      }

      // 4️⃣ Credit wallet
      wallet.balance += amount;
      await wallet.save({ session });

      // 5️⃣ Save transaction
      const transaction = await Transaction.create(
        [
          {
            userId,
            wallet: wallet._id,
            type: "credit",
            source: "checkout",
            amount,
            reference,
            status: "success",
            meta: payment,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
