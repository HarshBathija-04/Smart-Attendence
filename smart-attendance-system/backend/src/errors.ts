import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { config } from "./config";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (req) => {
  throw new AppError(404, `Route not found: ${req.method} ${req.path}`);
};

// Body-parser failures (by `type`) and Postgres constraint violations (by SQLSTATE `code`).
const KNOWN_ERRORS = new Map<string, [number, string]>([
  ["entity.too.large", [413, "Request body is too large"]],
  ["entity.parse.failed", [400, "Malformed JSON body"]],
  ["23505", [409, "A record with these details already exists"]],
  ["23503", [400, "Referenced record does not exist"]],
  ["22P02", [400, "Invalid identifier"]],
]);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err).fieldErrors });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const known = KNOWN_ERRORS.get(err?.type) ?? KNOWN_ERRORS.get(err?.code);
  if (known) {
    res.status(known[0]).json({ error: known[1] });
    return;
  }
  console.error(err);
  res.status(500).json({ error: config.isProd ? "Internal server error" : String(err?.message ?? err) });
};
