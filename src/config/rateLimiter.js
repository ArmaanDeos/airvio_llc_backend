import rateLimit from "express-rate-limit";

export const flightSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: {
    status: "error",
    message: "Too many search requests. Please wait and try again.",
  },
});
