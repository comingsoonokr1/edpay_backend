import mongoose from "mongoose";
import { ApiError } from "../shared/errors/api.error.js";
import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import { User } from "../model/User.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { BankService } from "./bank.service.js";




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
  static async getBanks() {
    try {
      const banks = await SafeHavenProvider.getBanks(); // New method in SafeHavenProvider
      return banks; // [{ code: "044", name: "Access Bank" }, ...]
    } catch (err: any) {
      throw new ApiError(
        err.response?.status || 500,
        "Failed to fetch bank list"
      );
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
    bankName,
    accountNumber,
  }: {
    senderId: string;
    method: "user" | "bank";
    recipient: string;
    amount: number;
    bankName?: string;
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
        if (!bankName || !accountNumber) throw new ApiError(400, "Bank and account number required");

        const user = await User.findById(senderId);
        if (!user || !user.safeHavenAccount?.accountNumber) {
          throw new ApiError(404, "User bank account not found");
        }

        // Step 1: Name Enquiry
        const nameEnquiryResponse = await BankService.nameEnquiry({bankName, accountNumber})
        if (!nameEnquiryResponse?.sessionId) throw new ApiError(400, "Name enquiry failed");

        // Step 2: Debit funds
        senderWallet.reservedBalance += amount;
        await senderWallet.save({ session });

        // Step 3: Initiate transfer
        const transferResponse = await SafeHavenProvider.transfer({
          nameEnquiryReference: nameEnquiryResponse.sessionId,
          debitAccountNumber: user.safeHavenAccount?.accountNumber,
          beneficiaryBankCode: nameEnquiryResponse.bankCode,
          beneficiaryAccountNumber: accountNumber,
          amount,
          saveBeneficiary: false,
          narration: `Wallet Transfer to ${accountNumber}`,
          paymentReference: `TRF_${Date.now()}`,
        });


        // Save transaction
        await Transaction.create(
          [{
            userId: senderId,
            type: "debit",
            amount,
            reference: transferResponse.paymentReference,
            status: "pending",
            source: "bank",
            details: { bankName, accountNumber, beneficiaryName: nameEnquiryResponse.accountName }
          }],
          { session }
        );

        await session.commitTransaction();

        return {
          message: "Bank transfer initiated",
          transferReference: transferResponse.paymentReference,
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


  static async checkPendingTransfer(paymentReference: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the pending transaction
      const transaction = await Transaction.findOne({
        reference: paymentReference,
        status: "pending",
        source: "bank"
      }).session(session);

      if (!transaction) throw new ApiError(404, "Pending transaction not found");

      const wallet = await Wallet.findOne({ userId: transaction.userId }).session(session);
      if (!wallet) throw new ApiError(404, "Wallet not found");

      // Call Safe Haven to get status
      const statusResponse = await SafeHavenProvider.transferStatus({ paymentReference });

      // Example structure returned by SafeHaven:
      // statusResponse.data.status === "success" | "failed" | "queued"
      const status = statusResponse.data.status.toLowerCase();

      if (status === "success") {
        // Debit already reserved, finalize transaction
        wallet.reservedBalance -= transaction.amount;
        wallet.balance -= transaction.amount; // if not already deducted
        await wallet.save({ session });

        transaction.status = "success";
        await transaction.save({ session });

      } else if (status === "failed") {
        // Release reserved funds
        wallet.reservedBalance -= transaction.amount;
        await wallet.save({ session });

        transaction.status = "failed";
        await transaction.save({ session });
      }
      // If queued/pending, do nothing yet

      await session.commitTransaction();
      return { transaction, status };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }


}
