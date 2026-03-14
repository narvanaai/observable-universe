// Structured logging. If you can't read it in 10 seconds, it's wrong.
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "civicos-api" },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length > 1
                  ? ` ${JSON.stringify(meta, null, 0)}`
                  : "";
                return `${timestamp} [${level}] ${message}${metaStr}`;
              })
            ),
    }),
  ],
});

export default logger;
