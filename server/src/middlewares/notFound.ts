import { ExpressHandler } from "../types/types.js";
import { AppError } from "../utils/AppError.js";

// Middleware for handling 404 "Not Found" routes
// Creates an AppError and passes it to the global error handler via `next()`.
export const notFound: ExpressHandler = (req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404))
}