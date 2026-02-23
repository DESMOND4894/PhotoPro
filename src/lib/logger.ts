/**
 * Lightweight structured logger.
 * Outputs JSON in production (Vercel parses JSON logs) and readable format in dev.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const isProd = process.env.NODE_ENV === "production";
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  if (isProd) {
    fn(
      JSON.stringify({
        level,
        message,
        ...(context && { context }),
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    fn(`[${level.toUpperCase()}] ${message}`, context || "");
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
