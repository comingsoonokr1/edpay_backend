import jwt, { SignOptions } from "jsonwebtoken";
import { jwtConfig } from "../shared/utils/jwt.config";
import { ApiError } from "../shared/errors/api.error";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../shared/types/jwt.types";

export class TokenService {
  //  Generate Access Token
  static generateAccessToken(payload: AccessTokenPayload): string {
    const options: SignOptions = {
      expiresIn: jwtConfig.accessExpiresIn,
    };

    return jwt.sign(
      payload,
      jwtConfig.accessSecret,
      options
    );
  }

  // Generate Refresh Token
  static generateRefreshToken(userId: string): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenType: "refresh",
    };

    const options: SignOptions = {
      expiresIn: jwtConfig.refreshExpiresIn,
    };

    return jwt.sign(
      payload,
      jwtConfig.refreshSecret,
      options
    );
  }

  //  Verify Access Token
  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(
        token,
        jwtConfig.accessSecret
      ) as AccessTokenPayload;
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
  }

  //  Verify Refresh Token
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(
        token,
        jwtConfig.refreshSecret
      ) as RefreshTokenPayload;
    } catch {
      throw new ApiError(403, "Invalid or expired refresh token");
    }
  }
}
