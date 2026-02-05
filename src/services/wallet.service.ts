import mongoose from "mongoose";
import { ApiError } from "../shared/errors/api.error.js";
import { Wallet } from "../model/Wallet.model.js";
import { Transaction } from "../model/Transaction.model.js";
import { User } from "../model/User.model.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { BankService } from "./bank.service.js";
import { comparePassword } from "../shared/helpers/password.helper.js";


function getRecipientType(value: string) {
  if (value.includes("@")) return "EMAIL";
  if (/^\d+$/.test(value)) return "ACCOUNT";
  throw new Error("Invalid recipient");
}

async function resolveRecipient(recipient: string) {
  const type = getRecipientType(recipient);

  /** ================= EMAIL ================= */
  if (type === "EMAIL") {
    const user = await User.findOne({ email: recipient });

    if (!user) throw new ApiError(404, "Recipient not found");

    if (!user.safeHavenAccount?.accountNumber) {
      throw new ApiError(404, "Recipient has no SafeHaven account");
    }

    return {
      accountNumber: user.safeHavenAccount.accountNumber,
      bankCode: user.safeHavenAccount.bankCode,
      userId: user._id.toString(),
      isInternal: true,
    };
  }

  /** ================= ACCOUNT NUMBER ================= */
  // Try resolving as internal SafeHaven account
  const internalUser = await User.findOne({
    "safeHavenAccount.accountNumber": recipient,
  });

  if (internalUser) {
    return {
      accountNumber: internalUser.safeHavenAccount?.accountNumber,
      bankCode: internalUser.safeHavenAccount?.bankCode,
      userId: internalUser._id.toString(),
      isInternal: true,
    };
  }

  // Otherwise external bank account
  return {
    accountNumber: recipient,
    bankCode: null,
    userId: null,
    isInternal: false,
  };
}


export class WalletService {
  static async getBalance(userId: string) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    // Find the user to get their SafeHaven account number
    const user = await User.findById(userId);
    if (!user || !user.safeHavenAccount?.accountId) {
      throw new ApiError(404, "User or SafeHaven account not found");
    }

    // Fetch latest account info from SafeHaven API
    const accountData = await SafeHavenProvider.getAccount(user.safeHavenAccount.accountId);


    // Update wallet balance with latest from SafeHaven
    wallet.balance = accountData.accountBalance;
    await wallet.save();

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
    recipient,
    amount,
    bankName,
    transactionPin,
    note,
  }: {
    senderId: string;
    method: "user" | "bank";
    recipient?: string;
    amount: number;
    bankName?: string;
    transactionPin: string;
    note?: string;
  }) {
    if (amount <= 0) throw new ApiError(400, "Invalid amount");
    if (!recipient) throw new ApiError(400, "Recipient required");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      /** ================= SENDER ================= */
      const sender = await User.findById(senderId).select("+transactionPin").session(session);
      if (!sender) throw new ApiError(404, "User not found");

      if (!sender.transactionPin)
        throw new ApiError(403, "Transaction PIN not set");

      const isPinValid = await comparePassword(
        transactionPin,
        sender.transactionPin
      );
      if (!isPinValid) throw new ApiError(401, "Invalid transaction PIN");

      if (!sender.safeHavenAccount?.accountNumber)
        throw new ApiError(404, "Sender SafeHaven account not found");

      /** ================= WALLET ================= */
      const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
      if (!senderWallet) throw new ApiError(404, "Sender wallet not found");

      const availableBalance =
        senderWallet.balance - (senderWallet.reservedBalance || 0);

      if (availableBalance < amount)
        throw new ApiError(403, "Insufficient balance");

      /** ================= RESOLVE RECIPIENT ================= */
      const resolved = await resolveRecipient(recipient);

      const isInternal = resolved.isInternal;

      const effectiveBankName = isInternal
        ? "Safe Haven microfinance Bank"
        : bankName;


      /** ================= NAME ENQUIRY ================= */
      const nameEnquiry = await BankService.nameEnquiry({
        bankName: effectiveBankName!,
        accountNumber: resolved.accountNumber!,
      });

      const effectiveBankCode = isInternal
        ? resolved.bankCode
        : nameEnquiry.bankCode;

      if (!nameEnquiry?.sessionId)
        throw new ApiError(400, "Name enquiry failed");

      /** ================= RESERVE FUNDS ================= */
      senderWallet.reservedBalance += amount;
      await senderWallet.save({ session });

      /** ================= SAFEHAVEN TRANSFER ================= */
      const paymentReference = `TRF_${Date.now()}`;

      /** ================= TRANSACTION ================= */
      await Transaction.create(
        [
          {
            userId: senderId,
            type: "debit",
            wallet:  senderWallet._id,
            amount,
            reference: paymentReference,
            status: "pending",
            source: "wallet",
            isInternal: resolved.isInternal,
            details: {
              beneficiaryName: nameEnquiry.accountName,
              beneficiaryAccountNumber: resolved.accountNumber,
              ...(resolved.userId ? { beneficiaryUserId: resolved.userId } : {}),
              ...(note ? { note } : {}),
            },
          },
        ],
        { session }
      );

      const transferResponse = await SafeHavenProvider.transfer({
        nameEnquiryReference: nameEnquiry.sessionId,
        debitAccountNumber: sender.safeHavenAccount.accountNumber,
        beneficiaryBankCode: effectiveBankCode!,
        beneficiaryAccountNumber: resolved.accountNumber!,
        amount,
        narration: note || "Wallet Transfer",
        saveBeneficiary: false,
        paymentReference,
      });

      
      await session.commitTransaction();

      return {
        message: "Transfer initiated",
        reference: transferResponse.paymentReference,
        balance: senderWallet.balance - senderWallet.reservedBalance,
      };
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
      const statusResponse = await SafeHavenProvider.transferStatus( paymentReference);

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
