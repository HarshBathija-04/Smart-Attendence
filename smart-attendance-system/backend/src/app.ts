import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { authRouter, requireAuth } from "./auth";
import { config } from "./config";
import { pool } from "./db";
import { errorHandler, notFound } from "./errors";
import { attendanceRouter } from "./routes/attendance";
import { classesRouter } from "./routes/classes";
import { dashboardRouter } from "./routes/dashboard";
import { reportsRouter } from "./routes/reports";
import { studentsRouter } from "./routes/students";

const limiter = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => config.NODE_ENV === "test",
    handler: (_req, res) => {
      res.status(429).json({ error: "Too many requests, please slow down" });
    },
  });

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // Render terminates TLS at its proxy
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.allowedOrigins.includes(origin)),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "9mb" }));

  app.get("/", (_req, res) => {
    res.json({ name: "Smart Attendance API", health: "/health" });
  });

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: "ok" });
    } catch {
      res.status(503).json({ status: "error", db: "error" });
    }
  });

  app.use("/api", limiter(600, 15 * 60_000));
  app.use("/api/auth/login", limiter(10, 15 * 60_000));
  app.use("/api/auth", authRouter);

  app.use("/api", requireAuth);
  // Face embedding is the expensive call.
  app.post(["/api/attendance/recognize", "/api/students", "/api/students/:id/face"], limiter(40, 60_000));
  app.use("/api/reports/insights", limiter(8, 60_000));

  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/reports", reportsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
