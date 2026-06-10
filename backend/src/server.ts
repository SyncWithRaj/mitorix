import dotenv from "dotenv";
dotenv.config({ path: "../.env", quiet: true } as any);

import app from "./app.js";
import { connectDB } from "./config/db.js";
import logger from "./lib/logger.js";

// Import workers so they start with the server process
import "./workers/repoWorker.js";
import "./workers/cleanupWorker.js";
import { cleanupQueue } from "./queue/jobQueue.js";

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // Schedule automated cleanup job (runs every hour)
  await cleanupQueue.add(
    "purge-inactive-repos",
    {},
    {
      repeat: {
        pattern: "0 * * * *", // Cron expression for top of every hour
      },
    }
  );

  app.listen(port, () => {
    logger.info({ port }, `RepoLens server is running`);
  });
};

startServer().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
