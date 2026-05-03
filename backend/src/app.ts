import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import healthRoute from "./routes/index.js";
import authRoute from "./routes/auth.route.js";
import repoRoutes from "./routes/repo.route.js";
import queryRoutes from "./routes/query.route.js";
import embedRoutes from "./routes/embedRepository.route.js";
import vectorInitRoutes from "./routes/vectorInit.route.js";
import fileRoute from "./routes/file.routes.js";
import callRoutes from "./routes/call.route.js";
import historyRoutes from "./routes/history.route.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// ✅ Trust proxy (Render runs behind a reverse proxy)
app.set("trust proxy", 1);

// ✅ CORS FIX (Dynamic for dev vs prod)
const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "http://localhost" : "http://localhost:3000");

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// routes
app.use("/api/v1", healthRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/repos", repoRoutes);
app.use("/api/v1/query", queryRoutes);
app.use("/api/v1/embed", embedRoutes);
app.use("/api/v1/vector", vectorInitRoutes);
app.use("/api/v1/files", fileRoute);
app.use("/api/v1/call", callRoutes);
app.use("/api/v1/history", historyRoutes);

app.use(errorHandler);

export default app;