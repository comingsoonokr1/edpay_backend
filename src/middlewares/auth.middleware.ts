import { Request, Response, NextFunction } from "express";
import { ApiError } from "../shared/errors/api.error.js";
import { TokenService } from "../services/token.service.js";


export const authMiddleware = (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) throw new ApiError(401, "Unauthorized");

  const token = authHeader.split(" ")[1];

  console.log(token);

  try {
     const decoded = TokenService.verifyAccessToken(token);
     
    req.user = decoded;
    next();
  } catch {
    throw new ApiError(401, "Invalid token");
  }
};
