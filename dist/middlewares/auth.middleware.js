import jwt from "jsonwebtoken";
import { ApiError } from "../shared/errors/api.error.js";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        throw new ApiError(401, "Unauthorized");
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        throw new ApiError(401, "Invalid token");
    }
};
