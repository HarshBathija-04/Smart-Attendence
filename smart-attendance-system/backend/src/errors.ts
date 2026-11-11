import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { config } from "./config";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (req) => {
  throw new AppError(404, `Route not found: ${req.method} ${req.path}`);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err).fieldErrors });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body is too large" });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  // Postgres constraint violations
  if (err?.code === "23505") {
    res.status(409).json({ error: "A record with these details already exists" });
    return;
  }
  if (err?.code === "23503") {
    res.status(400).json({ error: "Referenced record does not exist" });
    return;
  }
  if (err?.code === "22P02") {
    res.status(400).json({ error: "Invalid identifier" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: config.isProd ? "Internal server error" : String(err?.message ?? err) });
};
