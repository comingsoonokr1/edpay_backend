import { Request, Response } from "express";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";
import { DataService } from "../services/data.service.js";

export class DataController {
  // GET /data/providers
  static getProviders = asyncHandler(async (req: Request, res: Response) => {
    const providers = await DataService.getProviders();
    res.json({
      success: true,
      data: providers,
    });
  });

  // GET /data/plans?serviceCategoryId=...
  static getPlans = asyncHandler(async (req: Request, res: Response) => {
    const { provider } = req.query as { provider: string };
    const providerName = provider.toUpperCase();

    const providers = await DataService.getProviders();
    const selected = providers.find(p =>
      p.name.toUpperCase().includes(providerName) ||
      p.code.toUpperCase().includes(providerName)
    );

    if (!providerName) throw new ApiError(400, "Provider required");
    const plans = await DataService.getPlans(selected?.id!);
    res.json({
      success: true,
      data: plans,
    });
  });

  // POST /data/purchase
  static purchaseData = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const { provider, bundleCode, phone, transactionPin, statusUrl, amount } = req.body;
    if (!provider) throw new ApiError(400, "Provider required");

    const providerName = provider.toUpperCase();
    const providers = await DataService.getProviders();
    const selected = providers.find(p =>
      p.name.toUpperCase().includes(providerName) ||
      p.code.toUpperCase().includes(providerName)
    );

    if (!selected) throw new ApiError(400, "Invalid provider");

    if (!bundleCode || !phone || !transactionPin) {
      throw new ApiError(400, "Missing required fields");
    }

    const transaction = await DataService.purchaseData({
      userId,
      serviceCategoryId: selected.id,
      bundleCode,
      phone,
      amount,
      transactionPin,
      statusUrl,
    });

    res.status(201).json({
      success: true,
      message: "Data purchase successful",
      data: transaction,
    });
  });

  // GET /data/status/:reference
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const reference = req.params.reference as string;
    const transaction = await DataService.getStatus(reference);
    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}
