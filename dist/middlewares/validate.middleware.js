import { ApiError } from "../shared/errors/api.error.js";
export const validate = (schema) => (req, _res, next) => {
    try {
        schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        next();
    }
    catch (error) {
        const message = error.errors?.[0]?.message || "Validation failed";
        throw new ApiError(400, message);
    }
};
