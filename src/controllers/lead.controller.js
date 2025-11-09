import Lead from "../models/Leads.js";
import { ApiError } from "../utils/ApiError.js";
import { successResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { appendLeadToSheet } from "../utils/googleSheets.js"; // ✅ NEW IMPORT

/**
 * ✅ CREATE Lead (called from frontend on "Confirm & Book")
 */
export const createLead = async (req, res, next) => {
  try {
    const { flight, travellers, contact, payment } = req.body;

    if (!flight || !travellers || !contact || !payment) {
      throw new ApiError(400, "Missing required booking details");
    }

    // ✅ Generate unique confirmationId
    const confirmationId = `TKB-${crypto.randomInt(100000, 999999)}`;

    // ✅ Save to MongoDB
    const newLead = await Lead.create({
      confirmationId,
      flight,
      travellers,
      contact,
      payment,
      bookedAt: new Date(),
      source: "website",
      status: "confirmed",
    });

    console.log("✅ Lead saved in MongoDB:", newLead._id);

    // ✅ Append to Google Sheet (non-blocking)
    appendLeadToSheet(newLead)
      .then(() => console.log("✅ Lead successfully added to Google Sheet"))
      .catch((sheetError) =>
        console.error(
          "⚠️ Failed to add lead to Google Sheet:",
          sheetError.message
        )
      );

    // ✅ Send success response immediately
    return successResponse(res, "Lead created successfully", {
      id: newLead._id,
      confirmationId,
    });
  } catch (error) {
    console.error("❌ Lead creation error:", error);
    next(new ApiError(500, error.message || "Error saving lead"));
  }
};

/**
 * ✅ GET Lead by MongoDB ID
 */
export const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === "latest") {
      throw new ApiError(400, "Invalid lead ID");
    }

    const lead = await Lead.findById(id);
    if (!lead) throw new ApiError(404, "Lead not found");

    return successResponse(res, "Lead fetched successfully", lead);
  } catch (error) {
    next(new ApiError(500, error.message || "Error fetching lead"));
  }
};

/**
 * ✅ GET Lead by Confirmation ID
 */
export const getLeadByConfirmation = async (req, res, next) => {
  try {
    const { confirmationId } = req.params;
    const lead = await Lead.findOne({ confirmationId });

    if (!lead)
      throw new ApiError(404, "No booking found with this confirmation ID");

    return successResponse(res, "Booking fetched successfully", lead);
  } catch (error) {
    next(new ApiError(500, error.message || "Error fetching booking"));
  }
};

/**
 * ✅ GET Latest Lead (used for Booking Confirmation Page)
 */
export const getLatestLead = async (req, res, next) => {
  try {
    const latestLead = await Lead.findOne().sort({ createdAt: -1 });

    if (!latestLead) {
      return res.status(404).json({
        success: false,
        message: "No recent booking found",
      });
    }

    return successResponse(
      res,
      "Latest booking retrieved successfully",
      latestLead
    );
  } catch (error) {
    next(error);
  }
};
