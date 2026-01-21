import bcrypt from "bcrypt";
import { ApiError } from "../errors/api.error.js";
const SALT_ROUNDS = 12;
/**
 * Hash plain password
 */
export const hashPassword = async (password) => {
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    return bcrypt.hash(password, SALT_ROUNDS);
};
/**
 * Compare plain password with hashed password
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
    if (!plainPassword || !hashedPassword) {
        throw new ApiError(400, "Invalid password comparison");
    }
    return bcrypt.compare(plainPassword, hashedPassword);
};
