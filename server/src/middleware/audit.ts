// Audit log middleware. Every mutation logged. We're handling public civic data.
import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export function auditLog(req: Request, res: Response, next: NextFunction) {
  // Only log mutations — GET requests don't change state
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const startTime = Date.now();

    res.on("finish", () => {
      logger.info("AUDIT", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        userId: (req as any).auth?.userId || "anonymous",
        ip: req.ip,
        durationMs: Date.now() - startTime,
        // Log body for mutations, but strip sensitive fields
        body: sanitizeBody(req.body),
      });
    });
  }

  next();
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;
  const sanitized = { ...body };
  // Strip anything that looks like a credential
  const sensitiveKeys = ["password", "token", "secret", "authorization"];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}
