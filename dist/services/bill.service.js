import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
import { User } from "../model/User.model.js";
import { comparePassword } from "../shared/helpers/password.helper.js";
export class BillService {
    static async getProviderProducts(serviceCategoryId) {
        if (!serviceCategoryId) {
            throw new ApiError(400, "Service category ID is required");
        }
        const products = await SafeHavenProvider.getProviderProducts(serviceCategoryId);
        console.log(products);
        return products;
    }
    // Get providers (TV, Electricity, Education)
    static async getProviders(category) {
        // getVASProviders already returns array of providers
        const providers = await SafeHavenProvider.getVASProviders(category);
        if (!providers || providers.length === 0) {
            throw new ApiError(400, "Unable to fetch providers");
        }
        // Map to your desired format
        return providers.map((item) => ({
            serviceID: item.id, // note: id instead of serviceCategoryId
            name: item.name,
            type: item.code,
        }));
    }
    // Pay a bill
    static async payBill(data) {
        // Verify user's transaction PIN
        const user = await User.findById(data.userId).select("+transactionPin");
        if (!user)
            throw new ApiError(404, "User not found");
        if (!user.transactionPin)
            throw new ApiError(403, "Transaction PIN not set");
        const isPinValid = await comparePassword(data.transactionPin, user.transactionPin);
        if (!isPinValid)
            throw new ApiError(401, "Invalid transaction PIN");
        // 1️ Check wallet balance
        const wallet = await Wallet.findOne({ userId: data.userId });
        if (!wallet || wallet.balance < data.amount) {
            throw new ApiError(400, "Insufficient wallet balance");
        }
        // 2️ Create pending transaction
        const reference = `BILL-${Date.now()}`;
        const transaction = await Transaction.create({
            userId: data.userId,
            type: "bill",
            wallet: wallet._id,
            amount: data.amount,
            reference,
            status: "pending",
            details: { provider: data.provider, customerId: data.customerId },
        });
        if (!user || !user.safeHavenAccount?.accountNumber) {
            throw new ApiError(404, "User bank account not found");
        }
        try {
            // 3️ Prepare payload for SafeHavenProvider
            const payload = {
                serviceCategoryId: data.provider,
                amount: data.amount,
                debitAccountNumber: user.safeHavenAccount.accountNumber, // linked account
                customerId: data.customerId,
                statusUrl: data.statusUrl,
            };
            if (data.variationCode)
                payload.bundleCode = data.variationCode; // TV
            if (data.billType)
                payload.vendType = data.billType; // Utility
            // 4️⃣ Call SafeHaven API
            const response = await SafeHavenProvider.payBill(payload);
            // 5️⃣ Check for success
            // SafeHaven responses for VAS are usually { status: "success", ... }
            if (!response || response.status !== "success") {
                transaction.status = "failed";
                transaction.meta.response = response;
                await transaction.save();
                throw new ApiError(400, "Bill payment failed");
            }
            // 6️⃣ Debit wallet
            wallet.balance -= data.amount;
            await wallet.save();
            // 7️⃣ Update transaction
            transaction.status = "success";
            transaction.meta.response = response;
            await transaction.save();
            return transaction;
        }
        catch (err) {
            transaction.status = "failed";
            transaction.meta.error = err?.message || "Payment error";
            await transaction.save();
            throw err;
        }
    }
    // Check bill transaction status
    static async getStatus(reference) {
        const transaction = await Transaction.findOne({ reference });
        if (!transaction)
            throw new ApiError(404, "Transaction not found");
        return transaction;
    }
}
