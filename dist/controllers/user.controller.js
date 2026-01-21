var _a;
import { UserService } from "../services/user.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class UserController {
}
_a = UserController;
UserController.getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const user = await UserService.getProfile(userId);
    res.status(200).json({
        success: true,
        data: user,
    });
});
UserController.updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const updatedUser = await UserService.updateProfile(userId, req.body);
    res.status(200).json({
        success: true,
        data: updatedUser,
    });
});
UserController.changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    const result = await UserService.changePassword(userId, oldPassword, newPassword);
    res.status(200).json({
        success: true,
        message: result.message,
    });
});
