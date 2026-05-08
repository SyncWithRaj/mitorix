import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

// Import the workers so they start with the server process
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
    console.log(`Server is running on port ${port}`);
  });
};

startServer();
