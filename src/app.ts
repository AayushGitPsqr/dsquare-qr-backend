import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { businessCardRoutes } from "./routes/businessCardRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendOrigins,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use("/uploads", express.static(path.resolve(env.uploadDir)));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      message: "Business Card Scanner API is running"
    });
  });

  app.use("/api/cards", businessCardRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
