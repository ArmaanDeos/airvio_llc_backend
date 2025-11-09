import { Duffel } from "@duffel/api";
import { ApiError } from "../utils/ApiError.js";
import { successResponse } from "../utils/ApiResponse.js";
import ENV from "../config/env.js";

const duffel = new Duffel({
  token: ENV.DUFFEL_API_KEY,
});

export const searchFlights = async (req, res, next) => {
  try {
    const {
      tripType,
      origin,
      destination,
      departureDate,
      returnDate,
      travelClass,
      passengers,
    } = req.body;

    if (!origin || !destination || !departureDate) {
      throw new ApiError(
        400,
        "Origin, destination, and departure date are required"
      );
    }

    if (tripType === "Roundtrip" && !returnDate) {
      throw new ApiError(400, "Return date required for round-trip searches");
    }

    // === Build Slices ===
    const slices = [
      {
        origin,
        destination,
        departure_date: departureDate,
      },
    ];

    if (tripType === "Roundtrip") {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate,
      });
    }

    // === Passengers ===
    const { adults = 1, children = 0, infants = 0 } = passengers || {};
    const passengerArr = [
      ...Array(adults).fill({ type: "adult" }),
      ...Array(children).fill({ type: "child" }),
      ...Array(infants).fill({ type: "infant_without_seat" }),
    ];

    // === Duffel Offer Request ===
    const offerRequest = await duffel.offerRequests.create({
      slices,
      passengers: passengerArr,
      cabin_class: travelClass?.toLowerCase().replace(" ", "_") || "economy",
      max_connections: 2, // allow connecting flights
      supplier_timeout: 15000, // wait 15s max
      return_offers: true, // include offers in same response
    });

    const offers = offerRequest?.data?.offers || [];

    if (!offers.length) {
      return successResponse(res, "No flights found", []);
    }

    // === Transform Offers into Complete Format ===
    const formattedResults = offers.map((offer) => ({
      id: offer.id,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
      base_amount: offer.base_amount,
      tax_amount: offer.tax_amount,
      total_emissions_kg: offer.total_emissions_kg,
      owner: offer.owner?.name,
      airline_logo_code: offer.owner?.iata_code,
      created_at: offer.created_at,
      conditions: {
        change_before_departure:
          offer.conditions?.change_before_departure || {},
        change_after_departure: offer.conditions?.change_after_departure || {},
        refund_before_departure:
          offer.conditions?.refund_before_departure || {},
        refund_after_departure: offer.conditions?.refund_after_departure || {},
      },
      passengers: offer.passengers?.map((p) => ({
        type: p.type,
        cabin_class: p.cabin_class,
        baggage: {
          cabin: p.baggages?.cabin || [],
          checked: p.baggages?.checked || [],
        },
        fare_brand_name: p.fare_brand_name || null,
        conditions: p.conditions || {},
      })),
      slices: offer.slices.map((slice) => ({
        origin: slice.origin?.iata_code,
        destination: slice.destination?.iata_code,
        departure: slice.departure_at,
        arrival: slice.arrival_at,
        duration: slice.duration,
        layovers: slice.segments?.length > 1 ? slice.segments.length - 1 : 0,
        segments: slice.segments.map((seg) => ({
          origin: seg.origin?.iata_code,
          destination: seg.destination?.iata_code,
          departure: seg.departure_at,
          arrival: seg.arrival_at,
          duration: seg.duration,
          distance: seg.distance || null,
          aircraft: seg.aircraft?.name || "N/A",
          flight_number: seg.operating_carrier_flight_number,
          marketing_carrier: seg.marketing_carrier?.name,
          marketing_carrier_code: seg.marketing_carrier?.iata_code,
          operating_carrier: seg.operating_carrier?.name,
          operating_carrier_code: seg.operating_carrier?.iata_code,
          cabin_class: seg.cabin_class,
          baggage: seg.baggage?.included || [],
          stops: seg.stops?.length || 0,
          layover_duration: seg?.layover_duration || "PT0M", // optional
        })),
      })),
    }));

    return successResponse(
      res,
      "Flights fetched successfully",
      formattedResults
    );
  } catch (error) {
    console.error("Duffel API error:", error);
    next(
      new ApiError(
        error.status || 500,
        error.message || "Error fetching flights from Duffel"
      )
    );
  }
};
