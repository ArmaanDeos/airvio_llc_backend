import { ApiError } from "../utils/ApiError.js";

export const validateFlightSearch = (req, res, next) => {
  const { origin, destination, departureDate, tripType } = req.body;

  if (!origin || !destination || !departureDate) {
    throw new ApiError(
      400,
      "Origin, destination, and departure date are required"
    );
  }

  if (tripType === "Roundtrip" && !req.body.returnDate) {
    throw new ApiError(400, "Return date is required for round-trip searches");
  }

  next();
};
