import { Transaction } from "../model/Transaction.model.js";
import { Wallet } from "../model/Wallet.model.js";
import { VTPassProvider } from "../providers/vtpass.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
export class DataService {
    static async getProviders() {
        return [
            { code: "mtn-data", name: "MTN Data" },
            { code: "airtel-data", name: "Airtel Data" },
            { code: "glo-data", name: "Glo Data" },
            { code: "9mobile-data", name: "9mobile Data" },
        ];
    }
    static async getPlans(serviceID) {
        // Map frontend IDs to VTpass service IDs
        const serviceMap = {
            "mtn-data": "mtn-data",
            "airtel-data": "airtel-data",
            "glo-data": "glo-data", // VTpass uses "glo"
            "9mobile-data": "etisalat-data",
        };
        const mappedServiceID = serviceMap[serviceID];
        if (!mappedServiceID) {
            throw new ApiError(400, "Invalid service ID");
        }
        let response;
        try {
            response = await VTPassProvider.getDataPlans(mappedServiceID);
        }
        catch (error) {
            console.error("VTpass request failed:", error?.response?.data || error);
            throw new ApiError(503, "Data provider unavailable");
        }
        console.log("VTpass response:", response);
        // Correct success check (VTpass data endpoint)
        const isSuccess = response?.response_description === "000" ||
            response?.code === "000";
        if (!isSuccess) {
            console.error("VTpass error response:", response);
            throw new ApiError(400, response?.response_description || "Unable to fetch data plans");
        }
        //  Handle VTpass typo
        const variations = response?.content?.variations ||
            response?.content?.varations ||
            [];
        if (!variations.length) {
            throw new ApiError(404, "No data plans available");
        }
        return variations;
    }
    static async purchaseData(data) {
        // Fetch plans server-side
        const plans = await this.getPlans(data.serviceID);
        console.log(plans);
        const plan = plans.find((p) => p.variation_code === data.planId);
        console.log(plan);
        if (!plan) {
            throw new ApiError(400, "Invalid data plan selected");
        }
        const amount = Number(plan.variation_amount);
        const reference = `DATA-${Date.now()}`;
        // Prevent duplicates
        const existing = await Transaction.findOne({ reference });
        if (existing) {
            throw new ApiError(409, "Duplicate transaction");
        }
        // Atomic wallet debit
        const wallet = await Wallet.findOneAndUpdate({ userId: data.userId, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { new: true });
        if (!wallet) {
            throw new ApiError(400, "Insufficient wallet balance");
        }
        // Create pending transaction
        const transaction = await Transaction.create({
            userId: data.userId,
            type: "debit",
            source: "data",
            amount,
            reference,
            status: "pending",
            meta: {
                phone: data.phone,
                plan,
            },
        });
        try {
            const response = await VTPassProvider.purchaseData({
                serviceID: data.serviceID,
                billersCode: data.phone,
                variation_code: plan.variation_code,
                amount,
                request_id: reference,
            });
            if (response.code !== "000") {
                throw new Error("VTpass failed");
            }
            transaction.status = "success";
            transaction.meta.providerResponse = response;
            await transaction.save();
            return transaction;
        }
        catch (error) {
            // Refund wallet
            await Wallet.findOneAndUpdate({ userId: data.userId }, { $inc: { balance: amount } });
            transaction.status = "failed";
            transaction.meta.error = "Data purchase failed";
            await transaction.save();
            throw new ApiError(400, "Data subscription failed");
        }
    }
    static async getStatus(reference) {
        const transaction = await Transaction.findOne({ reference });
        if (!transaction) {
            throw new ApiError(404, "Transaction not found");
        }
        return transaction;
    }
}
