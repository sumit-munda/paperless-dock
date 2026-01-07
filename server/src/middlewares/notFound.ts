import { ExpressHandler } from "../types/types.js";
import { ErrorHandler } from "../utils/errorHandler.js";

// Middleware for handling 404 "Not Found" routes
// Creates an ErrorHandler and passes it to the global error handler via `next()`.
export const notFound: ExpressHandler = (req, res, next) => {
  next(new ErrorHandler(`Route ${req.originalUrl} not found`, 404));
};
