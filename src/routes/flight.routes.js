import express from "express";
import { searchFlights } from "../controllers/flightControllers.js";
import { validateFlightSearch } from "../middlewares/validateMiddlewares.js";
import { getTrendingRoutes } from "../controllers/getTrendingControllers.js";

const router = express.Router();

router.post("/search", validateFlightSearch, searchFlights);
router.get("/trending", getTrendingRoutes);

export default router;
