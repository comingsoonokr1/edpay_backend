import dotenv from "dotenv";
dotenv.config();
export const jwtConfig = {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: (process.env.ACCESS_TOKEN_EXPIRES || "15m"),
    refreshExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES || "7d"),
};
