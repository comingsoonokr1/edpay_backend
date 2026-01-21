import jwt from "jsonwebtoken";
import { jwtConfig } from "../shared/utils/jwt.config.js";
import { ApiError } from "../shared/errors/api.error.js";
export class TokenService {
    //  Generate Access Token
    static generateAccessToken(payload) {
        const options = {
            expiresIn: jwtConfig.accessExpiresIn,
        };
        return jwt.sign(payload, jwtConfig.accessSecret, options);
    }
    // Generate Refresh Token
    static generateRefreshToken(userId) {
        const payload = {
            userId,
            tokenType: "refresh",
        };
        const options = {
            expiresIn: jwtConfig.refreshExpiresIn,
        };
        return jwt.sign(payload, jwtConfig.refreshSecret, options);
    }
    //  Verify Access Token
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, jwtConfig.accessSecret);
        }
        catch {
            throw new ApiError(401, "Invalid or expired access token");
        }
    }
    //  Verify Refresh Token
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, jwtConfig.refreshSecret);
        }
        catch {
            throw new ApiError(403, "Invalid or expired refresh token");
        }
    }
}
