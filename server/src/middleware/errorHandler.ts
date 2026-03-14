// Global error handler. Catches everything. Logs everything. Returns clean JSON.
import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(500).json({
    error: "Internal server error",
    // Never leak stack traces in production
    ...(process.env.NODE_ENV !== "production" && { message: err.message }),
  });
}
