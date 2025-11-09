import mongoose from "mongoose";
import { log } from "../utils/logger.js";

const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri);
    log(`MongoDB Connected: ${conn.connection.host}`, "success");
  } catch (error) {
    log(`MongoDB Connection Error: ${error.message}`, "error");
    process.exit(1);
  }
};

export default connectDB;
