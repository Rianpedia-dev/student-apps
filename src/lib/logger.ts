/**
 * Structured Logging Service for Production Readiness
 * Merujuk ke plan-update-.md Fase 1 Task 1.7
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  action?: string;
  duration?: number;
  environment?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  private log(entry: LogEntry) {
    const payload: LogEntry = {
      ...entry,
      environment: process.env.NODE_ENV || "development",
    };

    const output = JSON.stringify(payload);

    if (entry.level === "error") {
      console.error(output);
    } else if (entry.level === "warn") {
      console.warn(output);
    } else if (entry.level === "debug") {
      if (!this.isProduction || process.env.DEBUG === "true") {
        console.debug(output);
      }
    } else {
      console.log(output);
    }
  }

  info(message: string, context?: Record<string, unknown>, meta?: { userId?: string; action?: string }) {
    this.log({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
      ...meta,
    });
  }

  warn(message: string, context?: Record<string, unknown>, meta?: { userId?: string; action?: string }) {
    this.log({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
      ...meta,
    });
  }

  error(message: string, context?: Record<string, unknown>, meta?: { userId?: string; action?: string }) {
    this.log({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
      ...meta,
    });
  }

  debug(message: string, context?: Record<string, unknown>, meta?: { userId?: string; action?: string }) {
    this.log({
      level: "debug",
      message,
      timestamp: new Date().toISOString(),
      context,
      ...meta,
    });
  }

  /**
   * Mengukur latensi eksekusi suatu operasi asinkron (database query, external API, server action)
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
    meta?: { userId?: string; action?: string }
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.info(`${label} completed in ${duration}ms`, { ...context, duration }, meta);
      return result;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      this.error(
        `${label} failed after ${duration}ms: ${err?.message || String(err)}`,
        { ...context, duration, error: err?.message || String(err), stack: err?.stack },
        meta
      );
      throw err;
    }
  }
}

export const logger = new Logger();
