import express from "express";
import {
  createLead,
  getLeadById,
  getLeadByConfirmation,
  getLatestLead,
} from "../controllers/lead.controller.js";

const router = express.Router();

// ✅ Specific routes first
router.post("/create", createLead);
router.get("/latest", getLatestLead);
router.get("/confirmation/:confirmationId", getLeadByConfirmation);

// ✅ Dynamic route last
router.get("/:id", getLeadById);

export default router;
