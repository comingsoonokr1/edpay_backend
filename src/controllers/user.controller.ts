import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

export class UserController {
  static getProfile = asyncHandler( async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await UserService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  static updateProfile = asyncHandler( async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updatedUser = await UserService.updateProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  })

  static changePassword = asyncHandler( async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { oldPassword, newPassword } = req.body;

    const result = await UserService.changePassword(
      userId,
      oldPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  })
}
