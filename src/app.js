import express from "express";
import cors from "cors";
import morgan from "morgan";

import ENV from "./config/env.js";
import { errorHandler } from "./middlewares/errorMiddlewares.js";
import { notFound } from "./middlewares/notFoundMiddlewares.js";
import { flightSearchLimiter } from "./config/rateLimiter.js";
import flightRoutes from "./routes/flight.routes.js";
import leadRoutes from "./routes/lead.routes.js";

const app = express();

// === Dynamic CORS Configuration ===
const allowedOrigins = [
  "http://localhost:3000",
  "https://airviollc.com",
  "https://www.airviollc.com",
  "https://fareandclick.com",
  "https://www.fareandclick.com",
   "https://flightexperto.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked request from: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ Allow cookies/auth headers if needed
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Logger (only for dev)
if (ENV.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// === API Routes ===
app.get("/", (req, res) => res.send("🚀 API is running..."));
app.use("/api/flights", flightSearchLimiter, flightRoutes);
app.use("/api/leads", leadRoutes);

// === Error Handlers ===
app.use(notFound);
app.use(errorHandler);

export default app;
