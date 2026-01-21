import { Request, Response } from "express";
import { Wallet } from "../model/Wallet.model.js";
import { ApiError } from "../shared/errors/api.error.js";
import { VTPassProvider } from "../providers/vtpass.provider.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { DataSubscription } from "../model/DataSubscription.model.js";

export class DataController {
  static purchaseData = asyncHandler(async (req: Request, res: Response) => {
    const { userId, serviceID, planCode, phone, amount } = req.body;

    // Check wallet balance
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    // Generate unique reference
    const reference = `DATA-${Date.now()}`;

    // Call VTPass purchaseData API
    const response = await VTPassProvider.purchaseData({
      request_id: reference,
      serviceID,
      billersCode: phone,
      variation_code: planCode,
      amount,
    });

    if (response.code !== "000") {
      throw new ApiError(400, "Data purchase failed: " + response.message || "Unknown error");
    }

    // Debit wallet
    wallet.balance -= amount;
    await wallet.save();

    // Save subscription record
    const subscription = await DataSubscription.create({
      userId,
      serviceID,
      planCode,
      phone,
      amount,
      reference,
      status: "success",
      meta: response,
    });

    res.status(201).json({
      success: true,
      data: subscription,
    });
  });

  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const subscription = await DataSubscription.findOne({ reference });

    if (!subscription) {
      throw new ApiError(404, "Data subscription not found");
    }

    res.status(200).json({
      success: true,
      data: subscription,
    });
  });
}
