import pino from "pino";
import { pinoHttp } from "pino-http";
import type { Logger, LoggerOptions } from "pino";

const isDev = process.env.NODE_ENV !== "production";

const loggerOptions: LoggerOptions = {
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
        censor: "[REDACTED]",
    },
    ...(isDev && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
                messageFormat: "[{module}] {msg}",
            },
        },
    }),
};

export const logger: Logger = pino(loggerOptions);

export const httpLogger = pinoHttp({
    logger,
    autoLogging: true,
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
});

export function logError(err: unknown, context: object = {}): void {
    if (err instanceof Error) {
        logger.error({ err, ...context }, err.message);
    } else {
        logger.error({ err, ...context }, "Non-Error value thrown");
    }
}

export function createModuleLogger(module: string): Logger {
    return logger.child({ module });
}
