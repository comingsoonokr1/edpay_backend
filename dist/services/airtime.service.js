import { Transaction } from "../model/Transaction.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { VTPassProvider } from "../providers/vtpass.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
export class AirtimeService {
    static async getProviders() {
        return [
            { code: "MTN", name: "MTN Nigeria" },
            { code: "AIRTEL", name: "Airtel Nigeria" },
            { code: "GLO", name: "Glo Nigeria" },
            { code: "9MOBILE", name: "9mobile" },
        ];
    }
    static async purchaseAirtime(data) {
        if (data.amount <= 0) {
            throw new ApiError(400, "Invalid airtime amount");
        }
        const reference = `AIR-${Date.now()}`;
        // Prevent duplicate transaction
        const existing = await Transaction.findOne({ reference });
        if (existing) {
            throw new ApiError(409, "Duplicate transaction");
        }
        // Atomic wallet debit
        const wallet = await Wallet.findOneAndUpdate({ userId: data.userId, balance: { $gte: data.amount } }, { $inc: { balance: -data.amount } }, { new: true });
        if (!wallet) {
            throw new ApiError(400, "Insufficient wallet balance");
        }
        // Create pending transaction
        const transaction = await Transaction.create({
            userId: data.userId,
            type: "debit",
            source: "airtime",
            amount: data.amount,
            reference,
            status: "pending",
        });
        try {
            const response = await VTPassProvider.purchaseAirtime({
                serviceID: data.provider,
                phone: data.phone,
                amount: data.amount,
                request_id: reference,
            });
            if (response.code !== "000") {
                throw new Error("VTpass failed");
            }
            transaction.status = "success";
            transaction.meta = response;
            await transaction.save();
            return transaction;
        }
        catch (error) {
            // Refund wallet on failure
            await Wallet.findOneAndUpdate({ userId: data.userId }, { $inc: { balance: data.amount } });
            transaction.status = "failed";
            transaction.meta = { error: "VTpass failed" };
            await transaction.save();
            throw new ApiError(400, "Airtime purchase failed");
        }
    }
    static async getStatus(reference) {
        const transaction = await Transaction.findOne({ reference });
        if (!transaction) {
            throw new ApiError(404, "Airtime transaction not found");
        }
        return transaction;
    }
}
