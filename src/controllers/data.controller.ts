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
    const { serviceCategoryId } = req.query;
    if (!serviceCategoryId) {
      throw new ApiError(400, "serviceCategoryId is required");
    }
    const plans = await DataService.getPlans(serviceCategoryId as string);
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

    const {
      serviceCategoryId,
      bundleCode,
      phone,
      amount,
      debitAccountNumber,
      statusUrl,
    } = req.body;

    if (!serviceCategoryId || !bundleCode || !phone || !amount || !debitAccountNumber) {
      throw new ApiError(400, "Missing required fields");
    }

    const transaction = await DataService.purchaseData({
      userId,
      serviceCategoryId,
      bundleCode,
      phone,
      amount,
      debitAccountNumber,
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
