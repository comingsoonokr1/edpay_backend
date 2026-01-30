import { Request, Response } from "express";
import { BankService } from "../services/bank.service.js";

export class BankController {
  static async getBanks(req: Request, res: Response) {
    const banks = await BankService.getBanks();

    return res.status(200).json({
      status: "success",
      message: "Banks fetched successfully",
      data: banks,
    });
  }

static async nameEnquiry(req: Request, res: Response) {
  const { bankName, accountNumber } = req.body;

  const result = await BankService.nameEnquiry({
    bankName,
    accountNumber,
  });

  return res.status(200).json({
    status: "success",
    message: "Account verified successfully",
    data: result,
  });
}

}
