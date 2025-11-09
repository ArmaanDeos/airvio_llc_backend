import ENV from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import { log } from "./utils/logger.js";

connectDB(ENV.MONGO_URI);

app.listen(ENV.PORT, () => {
  log(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`, "success");
});
