import dotenv from "dotenv";
dotenv.config();

const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI:
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_URI_PROD
      : process.env.MONGO_URI_DEV,
  DUFFEL_API_KEY: process.env.DUFFEL_API_KEY || "",
  DUFFEL_BASE_URL:
    process.env.DUFFEL_BASE_URL || "https://api.duffel.com/air/offer_requests",
};

export default ENV;
