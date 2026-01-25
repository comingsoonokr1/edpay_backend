import { Transaction } from "../model/Transaction.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { VTPassProvider } from "../providers/vtpass.provider.js";
import { ApiError } from "../shared/errors/api.error.js";

export class BillService {
  // Get providers by category (tv or electricity)
  static async getProviders(category: "tv" | "electricity") {
    const response = await VTPassProvider.getCategoryBillers(category);

    if (response.code !== "000") {
      throw new ApiError(400, "Unable to fetch providers");
    }

    return response.content.map((item: any) => ({
      serviceID: item.serviceID,  // e.g., dstv, ikeja-electric
      name: item.name,
      type: item.type || null,    // e.g., prepaid, postpaid
    }));
  }

  // Pay bill (TV or Electricity) with optional variationCode and billType
  static async payBill(data: {
    userId: string;
    provider: string;          // serviceID e.g., dstv, ikeja-electric
    customerId: string;        // smartcard, meter number, or customer id
    amount: number;
    variationCode?: string;    // optional for TV plans
    billType?: "prepaid" | "postpaid";  // optional for electricity
  }) {
    const wallet = await Wallet.findOne({ userId: data.userId });
    if (!wallet || wallet.balance < data.amount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    const reference = `BILL-${Date.now()}`;

    // Check if transaction with this reference already exists
    const existing = await Transaction.findOne({ reference });
    if (existing) return existing;

    // Create pending transaction first
    const transaction = await Transaction.create({
      userId: data.userId,
      type: "bill",
      amount: data.amount,
      reference,
      status: "pending",
      meta: {
        provider: data.provider,
        customerId: data.customerId,
        variationCode: data.variationCode || null,
        billType: data.billType || null,
      },
    });

    try {
      // Build VTpass request payload dynamically
      const payload: any = {
        serviceID: data.provider,
        billersCode: data.customerId,
        amount: data.amount,
        request_id: reference,
      };

      if (data.variationCode) {
        payload.variation_code = data.variationCode;
      }
      if (data.billType) {
        payload.type = data.billType;
      }

      // Call VTpass payBill
      const response = await VTPassProvider.payBill(payload);

      if (response.code !== "000") {
        transaction.status = "failed";
        transaction.meta.response = response;
        await transaction.save();

        throw new ApiError(400, "Bill payment failed");
      }

      // Debit wallet only after successful payment
      wallet.balance -= data.amount;
      await wallet.save();

      transaction.status = "success";
      transaction.meta.response = response;
      await transaction.save();

      return transaction;
    } catch (error: any) {
      transaction.status = "failed";
      transaction.meta.error = error?.message || "Payment error";
      await transaction.save();

      throw error;
    }
  }

  static async getStatus(reference: string) {
    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      throw new ApiError(404, "Bill payment not found");
    }

    return transaction;
  }
}
