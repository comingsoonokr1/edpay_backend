import { Request, Response } from "express";
import { WalletService } from "../services/wallet.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";

export class WalletController {

  static getAccount = asyncHandler( async(req: Request, res:Response) => {
    const { accountId } = req.params  as {accountId: string};
    if(!accountId) {
      throw new Error("accountId needed");
    }
    const account = await SafeHavenProvider.getAccount(accountId);

    console.log(account);
    

    res.status(200).json({
      success: true,
      data: {
        account
      }
    })
  })

  static getBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const balance = await WalletService.getBalance(userId);

    res.status(200).json({
      success: true,
      data: { balance },
    });
  });

  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const transactions = await WalletService.getTransactions(userId);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  });

  static getTransactionByReference = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { reference } = req.params as { reference: string };

    const transaction = await WalletService.getTransactionByReference(userId, reference);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });

  static getBanks = asyncHandler(async (_req: Request, res: Response) => {
    const banks = await WalletService.getBanks();

    res.status(200).json({
      success: true,
      data: banks,
    });
  });

  static withdraw = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { amount } = req.body;

    const balance = await WalletService.withdraw(userId, amount);

    res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      data: { balance },
    });
  });

  static transfer = asyncHandler(async (req: Request, res: Response) => {
    const senderId = req.user!.userId;
    const { method, recipient, amount, bankName, accountNumber, transactionPin, note} = req.body;

    if (!method || !recipient || !amount) {
      return res.status(400).json({
        success: false,
        message: "Method, recipient, and amount are required",
      });
    }

    const result = await WalletService.transfer({
      senderId,
      method,
      recipient,
      amount,
      bankName,
      transactionPin,
      note
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        balance: result.balance,
        transferReference: result.reference,
      },
    });
  });

  // New endpoint: Check bank transfer status
  static checkTransferStatus = asyncHandler(async (req: Request, res: Response) => {
    const { transferReference } = req.params as { transferReference: string };

    if (!transferReference) {
      return res.status(400).json({
        success: false,
        message: "Transfer reference is required",
      });
    }

    const result = await WalletService.checkPendingTransfer(transferReference);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
