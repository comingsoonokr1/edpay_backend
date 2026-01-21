import { UserDocument } from "../../model/User.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserDocument["role"];
      };
    }
  }
}

export {};
