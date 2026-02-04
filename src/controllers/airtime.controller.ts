import { Request, Response } from "express";
import { AirtimeService } from "../services/airtime.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";

export class AirtimeController {
  static getProviders = asyncHandler(async (_req: Request, res: Response) => {
    const providers = await AirtimeService.getProviders();

    res.status(200).json({
      success: true,
      data: providers,
    });
  });

  static purchase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { provider, phone, amount, statusUrl, transactionPin } = req.body;

    if (!transactionPin) {
      throw new ApiError(400, "transactionPin is required");
    }

    const transaction = await AirtimeService.purchaseAirtime({
      userId,
      provider,
      phone,
      amount,
      transactionPin,
      statusUrl, // optional
    });

    res.status(201).json({
      success: true,
      message: "Airtime purchase successful",
      data: transaction,
    });
  });


  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const reference = req.params.reference as string;

    const transaction = await AirtimeService.getStatus(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
