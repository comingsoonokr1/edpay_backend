import { Transaction } from "../model/Transaction.model.js";
import { User } from "../model/User.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
import { comparePassword } from "../shared/helpers/password.helper.js";
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
        if (data.amount <= 0)
            throw new ApiError(400, "Invalid airtime amount");
        const reference = `SH-${Date.now()}`;
        // Prevent duplicate transaction
        const existing = await Transaction.findOne({ reference });
        if (existing)
            throw new ApiError(409, "Duplicate transaction");
        // Verify user's transaction PIN
        const user = await User.findById(data.userId);
        if (!user)
            throw new ApiError(404, "User not found");
        if (!user.transactionPin)
            throw new ApiError(403, "Transaction PIN not set");
        const isPinValid = await comparePassword(data.transactionPin, user.transactionPin);
        if (!isPinValid)
            throw new ApiError(401, "Invalid transaction PIN");
        // Debit wallet atomically
        const wallet = await Wallet.findOneAndUpdate({ userId: data.userId, balance: { $gte: data.amount } }, { $inc: { balance: -data.amount } }, { new: true });
        if (!wallet)
            throw new ApiError(400, "Insufficient wallet balance");
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
            // 1️⃣ Fetch provider category dynamically
            const providers = await SafeHavenProvider.getAirtimeProviders();
            const provider = providers.find(p => p.code === data.provider.toUpperCase());
            if (!provider)
                throw new ApiError(404, "Provider not found");
            // 2️⃣ SafeHaven purchase
            const response = await SafeHavenProvider.purchaseAirtime({
                phone: data.phone,
                amount: data.amount,
                serviceCategoryId: provider.id,
                debitAccountNumber: data.debitAccountNumber,
                statusUrl: data.statusUrl,
                reference,
            });
            transaction.status = "success";
            transaction.meta = response;
            await transaction.save();
            return transaction;
        }
        catch (err) {
            // Refund wallet on failure
            await Wallet.findOneAndUpdate({ userId: data.userId }, { $inc: { balance: data.amount } });
            transaction.status = "failed";
            transaction.meta = { error: err };
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
