import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { asyncHandler } from "../shared/utils/asyncHandler";


export class PaymentController {
  static initiatePayment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { amount, channel } = req.body;

    const transaction = await PaymentService.initiatePayment({
      userId,
      amount,
      channel,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.body;

    const transaction = await PaymentService.verifyPayment(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });

  static getTransaction = asyncHandler(async (req: Request, res: Response) => {
    const transactionId = req.params.transactionId as string;

    const transaction = await PaymentService.getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });

  static listTransactions = asyncHandler(async (req: Request, res: Response) => {
    const filter = req.query || {};

    const transactions = await PaymentService.listTransactions(filter);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  });
}
