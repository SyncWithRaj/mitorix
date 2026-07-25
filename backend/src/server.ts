import dotenv from "dotenv";
dotenv.config({ path: "../.env", quiet: true } as any);

import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./lib/logger.js";

// Import workers so they start with the server process
import "./workers/repoWorker.js";
import { startCleanupWorker } from "./workers/cleanupWorker.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  startCleanupWorker();

  app.listen(port, () => {
    logger.info({ port }, `Mitorix server is running`);
  });
};

startServer().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
// test gemini bot
