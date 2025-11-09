import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    confirmationId: String,
    flight: Object,
    travellers: Object,
    contact: Object,
    payment: Object,
    bookedAt: String,
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
