import { Request, Response } from "express";
import { WalletService } from "../services/wallet.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

export class WalletController {
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

  static fundWallet = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { amount } = req.body;

    const balance = await WalletService.createStripePaymentIntent(userId, amount);

    res.status(200).json({
      success: true,
      message: "Wallet funded successfully",
      data: { balance },
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
    const { method, recipient, amount, bank, accountNumber } = req.body;

    // Validate required fields
    if (!method || !recipient || !amount) {
      return res.status(400).json({
        success: false,
        message: "Method, recipient, and amount are required",
      });
    }

    // Call WalletService.transfer
    const result = await WalletService.transfer({
      senderId,
      method,
      recipient,
      amount,
      bank,
      accountNumber,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: { balance: result.balance, transferCode: result.transferCode },
    });
  });
}
