import { SignOptions } from "jsonwebtoken";

export interface AccessTokenPayload {
    userId: string;
    role: "user" | "admin";
}

export interface RefreshTokenPayload {
    userId: string;
    tokenType: "refresh";
}
