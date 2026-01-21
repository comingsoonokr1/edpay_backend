import { Request, Response } from "express";
import { BankService } from "../services/bank.service";
import { asyncHandler } from "../shared/utils/asyncHandler";

export class BankController {
  static linkBank = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId; 
    const { bankName, accountNumber, accountName, bankCode } = req.body;

    const bankAccount = await BankService.linkBankAccount({
      userId,
      bankName,
      accountNumber,
      accountName,
      bankCode
    });

    res.status(201).json({
      success: true,
      message: "Bank account linked successfully",
      data: bankAccount,
    });
  });

  static getUserBanks = asyncHandler( async (req: Request, res: Response) => {

    const userId = req.user!.userId as string;

    const banks = await BankService.getUserBanks(userId);

    res.status(200).json({
      success: true,
      data: banks,
    });
  });
}
