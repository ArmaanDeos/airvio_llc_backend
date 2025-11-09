import { Duffel } from "@duffel/api";
import { ApiError } from "../utils/ApiError.js";
import { successResponse } from "../utils/ApiResponse.js";
import ENV from "../config/env.js";

const duffel = new Duffel({
  token: ENV.DUFFEL_API_KEY,
});

export const getTrendingRoutes = async (req, res, next) => {
  try {
    // === 1️⃣ Predefined Trending Route Pairs ===
    const trendingPairs = [
      { origin: "JFK", destination: "LAX" }, // New York → Los Angeles
      { origin: "ORD", destination: "MIA" }, // Chicago → Miami
      { origin: "SFO", destination: "LAS" }, // San Francisco → Las Vegas
      { origin: "DFW", destination: "NYC" }, // Dallas → New York
      { origin: "SEA", destination: "ORD" }, // Seattle → Chicago
      { origin: "ATL", destination: "TPA" }, // Atlanta → Tampa
    ];

    // === 2️⃣ Fetch flight offers for each route (parallel) ===
    const offers = await Promise.all(
      trendingPairs.map(async (r) => {
        try {
          const offerRequest = await duffel.offerRequests.create({
            slices: [
              {
                origin: r.origin,
                destination: r.destination,
                departure_date: "2025-11-25", // can be dynamic (next week)
              },
            ],
            passengers: [{ type: "adult" }],
            cabin_class: "economy",
            max_connections: 1,
            supplier_timeout: 10000,
            return_offers: true,
          });

          const offer = offerRequest?.data?.offers?.[0];
          if (!offer)
            return {
              from: r.origin,
              to: r.destination,
              price: "N/A",
              airline: "No flights found",
            };

          return {
            from: r.origin,
            to: r.destination,
            airline: offer.owner?.name || "Unknown Airline",
            airline_code: offer.owner?.iata_code || null,
            airline_logo: offer.owner?.iata_code
              ? `https://images.kiwi.com/airlines/64/${offer.owner.iata_code}.png`
              : null,
            total_amount: offer.total_amount,
            total_currency: offer.total_currency,
            formatted_price: `$${offer.total_amount}`,
            duration:
              offer.slices?.[0]?.duration
                ?.replace("PT", "")
                .replace("H", "h ") || "N/A",
            departure: offer.slices?.[0]?.departure_at,
            arrival: offer.slices?.[0]?.arrival_at,
            route_date:
              offer.slices?.[0]?.departure_at?.slice(0, 10) || "2025-11-25",
          };
        } catch (err) {
          console.error(
            `Duffel fetch error for ${r.origin}→${r.destination}:`,
            err.message
          );
          return {
            from: r.origin,
            to: r.destination,
            price: "N/A",
            airline: "Error fetching data",
          };
        }
      })
    );

    // === 3️⃣ Filter out invalid results ===
    const validOffers = offers.filter((o) => o && o.price !== "N/A");

    // === 4️⃣ Return Success Response ===
    return successResponse(
      res,
      "Trending routes fetched successfully",
      validOffers
    );
  } catch (error) {
    console.error("Trending routes error:", error);
    next(
      new ApiError(
        error.status || 500,
        error.message || "Error fetching trending routes"
      )
    );
  }
};
