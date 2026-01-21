import { Transaction } from "../model/Transaction.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { stripe } from "../providers/stripe.provider.js";
import { ApiError } from "../shared/errors/api.error.js";

export class PaymentService {
  static async initiatePayment(data: {
    userId: string;
    amount: number;
    channel: "card" | "bank" | "wallet";
  }) {
    if (data.amount <= 0) {
      throw new ApiError(400, "Invalid payment amount");
    }

    const reference = `PAY-${Date.now()}`;

    if (data.channel !== "card") {
      throw new ApiError(400, "Unsupported payment channel");
    }

    // Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // convert to kobo
      currency: "ngn",
      payment_method_types: ["card"],
      metadata: {
        userId: data.userId,
        reference,
      },
    });

    await Transaction.create({
      userId: data.userId,
      amount: data.amount,
      type: "payment",
      status: "pending",
      reference,
      channel: "card",
      meta: {
        paymentIntentId: paymentIntent.id,
      },
    });

    return {
      reference,
      clientSecret: paymentIntent.client_secret,
    };
  }

  static async verifyPayment(reference: string) {
    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    // Idempotency protection
    if (transaction.status === "success") {
      return transaction;
    }

    if (!transaction.meta?.paymentIntentId) {
      throw new ApiError(400, "Invalid transaction metadata");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      transaction.meta.paymentIntentId
    );

    if (paymentIntent.status !== "succeeded") {
      throw new ApiError(400, "Payment not completed");
    }

    // Atomic wallet update
    const wallet = await Wallet.findOneAndUpdate(
      { userId: transaction.userId },
      { $inc: { balance: transaction.amount } },
      { new: true }
    );

    if (!wallet) {
      throw new ApiError(500, "Wallet not found");
    }

    transaction.status = "success";
    await transaction.save();

    return transaction;
  }

  static async getTransaction(transactionId: string) {
    return Transaction.findById(transactionId);
  }

  static async listTransactions(filter: any) {
    return Transaction.find(filter).sort({ createdAt: -1 });
  }
}
