import { Request, Response } from "express";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";
import { DataService } from "../services/data.service.js";

export class DataController {
  static getProviders = asyncHandler(async (req: Request, res: Response) => {
    const providers = await DataService.getProviders();
    res.json({
      success: true,
      data: providers,
    });
  });

  static getPlans = asyncHandler(async (req: Request, res: Response) => {
    const { serviceID } = req.query;
    if (!serviceID) {
      throw new ApiError(400, "serviceID is required");
    }
    const plans = await DataService.getPlans(serviceID as string);
    res.json({
      success: true,
      data: plans,
    });
  });

  static purchaseData = asyncHandler(async (req: Request, res: Response) => {
    const { serviceID, planId, phone } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }
    const transaction = await DataService.purchaseData({
      userId,
      serviceID,
      planId,
      phone,
    });
    res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const reference = req.params.reference as string;
    const transaction = await DataService.getStatus(reference);
    res.status(200).json({
      success: true,
      data: transaction,
    });
  });
}