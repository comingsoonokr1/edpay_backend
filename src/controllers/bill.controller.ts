import { Request, Response } from "express";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { BillService } from "../services/bill.service.js";

export class BillController {

  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { serviceCategoryId } = req.params as { serviceCategoryId: string };

    const products = await BillService.getProviderProducts(serviceCategoryId);
    res.status(200).json({ success: true,  data: products });
  });
  // Get providers
  static getProviders = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query as { category: "tv" | "electricity" };
    const providers = await BillService.getProviders(category);
    res.status(200).json({ success: true, data: providers });
  });

  // Pay bill
  static payBill = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { provider, customerId, amount, variationCode, billType, transactionPin } = req.body;

    const transaction = await BillService.payBill({
      userId,
      provider,
      customerId,
      amount,
      variationCode,
      billType,
      transactionPin,
    });

    res.status(200).json({
      success: true,
      message: "Bill paid successfully",
      data: transaction,
    });
  });

  // Get bill status
  static getBillStatus = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params as { reference: string };
    const transaction = await BillService.getStatus(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
