import { Request, Response } from "express";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { BillService } from "../services/bill.service.js";

export class BillController {
  // Get providers
  static getProviders = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query as { category: "tv" | "electricity" | "education" };
    const providers = await BillService.getProviders(category);
    res.status(200).json({ success: true, data: providers });
  });

  // Pay bill
  static payBill = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { provider, customerId, amount, variationCode, billType } = req.body;

    const transaction = await BillService.payBill({
      userId,
      provider,
      customerId,
      amount,
      variationCode,
      billType,
    });

    res.status(200).json({
      success: true,
      message: "Bill paid successfully",
      data: transaction,
    });
  });

  // Get bill status
  static getBillStatus = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params as {reference: string};
    const transaction = await BillService.getStatus(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
