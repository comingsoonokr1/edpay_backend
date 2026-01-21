import { Request, Response } from "express";
import { BillService } from "../services/bill.service";
import { asyncHandler } from "../shared/utils/asyncHandler";

export class BillController {
  static getProviders = asyncHandler( async (_req: Request, res: Response) => {
    const providers = await BillService.getProviders();

    res.status(200).json({
      success: true,
      data: providers,
    });
  });

  static payBill = asyncHandler( async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { provider, customerId, amount } = req.body;

    const transaction = await BillService.payBill({
      userId,
      provider,
      customerId,
      amount,
    });

    res.status(201).json({
      success: true,
      message: "Bill payment successful",
      data: transaction,
    });
  });

  static getstatus = asyncHandler( async (req: Request, res: Response) => {
    const reference = req.params.reference as string;

    const transaction = await BillService.getStatus(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
