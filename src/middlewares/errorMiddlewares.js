import { ApiError } from "../utils/ApiError.js";
import { log } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  if (!(err instanceof ApiError)) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    err = new ApiError(statusCode, err.message || "Internal Server Error");
  }

  const response = {
    status: "error",
    statusCode: err.statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  log(`[${err.statusCode}] ${err.message}`, "error");
  return res.status(err.statusCode).json(response);
};
