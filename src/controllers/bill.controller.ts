import { Request, Response } from "express";
import { BillService } from "../services/bill.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";

export class BillController {
 static getProviders = asyncHandler( async (req: Request, res: Response) => {
  const { category } = req.query as { category: "tv" | "electricity" | "education" };
  if (!category) {
    throw new ApiError(400, "Category is required");
  }
  const providers = await BillService.getProviders(category);

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
