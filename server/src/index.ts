// CivicOS API Server
// Civic transparency platform. Built in the USA.
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import logger from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { auditLog } from "./middleware/audit";
import citiesRouter from "./routes/cities";
import budgetsRouter from "./routes/budgets";
import issuesRouter from "./routes/issues";
import notificationsRouter from "./routes/notifications";
import pressureRouter from "./routes/pressure";
import uploadRouter from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 3001;

// --- SECURITY ---
// Relaxed CSP for dev — allows inline scripts from Vite build
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// --- PARSING ---
app.use(express.json({ limit: "1mb" }));

// --- LOGGING ---
// Request logging — every request, method, path, status, duration
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: { write: (msg: string) => logger.info(msg.trim()) },
  })
);

// --- AUDIT ---
app.use(auditLog);

// --- RATE LIMITING ---
// Writes are rate limited. Reads are not — public data should be accessible.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 write requests per 15 minutes per IP
  message: { error: "Too many requests. Try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

// --- HEALTH CHECK ---
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "civicos-api",
    timestamp: new Date().toISOString(),
  });
});

// --- ROUTES ---
app.use("/api/cities", citiesRouter);
app.use("/api", budgetsRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api", pressureRouter);
app.use("/api/upload", uploadRouter);

// --- STATIC FILES ---
// Serve the built React app from client/dist — single port, no proxy
const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));

// SPA fallback — any non-API route serves index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

// --- ERROR HANDLING ---
app.use(errorHandler);

// --- START ---
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`CivicOS API running on port ${PORT}`, {
    env: process.env.NODE_ENV || "development",
    port: PORT,
  });
});

export default app;
