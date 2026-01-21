import { Request, Response } from "express";
import { AirtimeService } from "../services/airtime.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

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
    const { provider, phone, amount } = req.body;

    const transaction = await AirtimeService.purchaseAirtime({
      userId,
      provider,
      phone,
      amount,
    });

    res.status(201).json({
      success: true,
      message: "Airtime purchase successful",
      data: transaction,
    });
  })

  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const reference = req.params.reference as string;

    const transaction = await AirtimeService.getStatus(reference);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
