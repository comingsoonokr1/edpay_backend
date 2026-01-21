import { ApiError } from "../shared/errors/api.error";
import { User } from "../model/User.model";
import { hashPassword, comparePassword } from "../shared/helpers/password.helper";

export class UserService {
  static async getProfile(userId: string) {
    return User.findById(userId).select("-password");
  }

  static async updateProfile(
    userId: string,
    data: Partial<{ fullName: string; email: string }>
  ) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Old password is incorrect");
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return { message: "Password changed successfully" };
  }
}
