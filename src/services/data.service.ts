import { Transaction } from "../model/Transaction.model.js";
import { User } from "../model/User.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
import { comparePassword } from "../shared/helpers/password.helper.js";

export class DataService {
  /**
   * Get available Data providers
   */
  static async getProviders() {
    // Use SafeHaven dynamic providers
    const providers = await SafeHavenProvider.getDataProviders();
    return providers.map(p => ({
      code: p.code,
      name: p.name,
      id: p.id,          // serviceCategoryId
      productId: p.productId,
    }));
  }

  /**
   * Get available data plans for a provider
   */
  static async getPlans(serviceCategoryId: string) {
    const plans = await SafeHavenProvider.getDataPlans(serviceCategoryId);

    if (!plans.length) {
      throw new ApiError(404, "No data plans available for this provider");
    }

    return plans;
  }

  /**
   * Purchase a data bundle
   */
  static async purchaseData(data: {
    userId: string;
    serviceCategoryId: string; // from provider
    bundleCode: string;        // from selected plan
    phone: string;
    amount: number;
    debitAccountNumber: string;
    transactionPin: string;
    statusUrl?: string;
  }) {
    const reference = `DATA-${Date.now()}`;

    // Prevent duplicate transaction
    const existing = await Transaction.findOne({ reference });
    if (existing) {
      throw new ApiError(409, "Duplicate transaction");
    }

    // Verify user's transaction PIN
        const user = await User.findById(data.userId);
        if (!user) throw new ApiError(404, "User not found");
        if (!user.transactionPin) throw new ApiError(403, "Transaction PIN not set");
    
        const isPinValid = await comparePassword(data.transactionPin, user.transactionPin);
        if (!isPinValid) throw new ApiError(401, "Invalid transaction PIN");

    // Debit wallet atomically
    const wallet = await Wallet.findOneAndUpdate(
      { userId: data.userId, balance: { $gte: data.amount } },
      { $inc: { balance: -data.amount } },
      { new: true }
    );

    if (!wallet) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: data.userId,
      type: "debit",
      source: "data",
      amount: data.amount,
      reference,
      status: "pending",
      meta: {
        phone: data.phone,
        bundleCode: data.bundleCode,
      },
    });

    try {
      // Call SafeHaven purchase
      const response = await SafeHavenProvider.purchaseData({
        serviceCategoryId: data.serviceCategoryId,
        phone: data.phone,
        bundleCode: data.bundleCode,
        amount: data.amount,
        debitAccountNumber: data.debitAccountNumber,
        reference,
        statusUrl: data.statusUrl,
      });

      transaction.status = "success";
      transaction.meta.providerResponse = response;
      await transaction.save();

      return transaction;
    } catch (err) {
      // Refund wallet on failure
      await Wallet.findOneAndUpdate(
        { userId: data.userId },
        { $inc: { balance: data.amount } }
      );

      transaction.status = "failed";
      transaction.meta.error = err instanceof Error ? err.message : err;
      await transaction.save();

      throw new ApiError(400, "Data subscription failed");
    }
  }

  /**
   * Check data transaction status
   */
  static async getStatus(reference: string) {
    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    return transaction;
  }
}
