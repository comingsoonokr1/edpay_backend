import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../shared/errors/api.error.js";

export const validate =
  (schema: ZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error: any) {
      const message = error.errors?.[0]?.message || "Validation failed";
      throw new ApiError(400, message);
    }
  };
