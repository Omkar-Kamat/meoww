// src/config/db.ts
import mongoose, { ConnectionStates, type ConnectOptions } from "mongoose";
import { createModuleLogger, logError } from "../utils/logger.js";

const log = createModuleLogger("mongodb");

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

const connectDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error("MONGO_URI environment variable is required");
    }

    mongoose.set("strictQuery", true);

    const options: ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const conn = await mongoose.connect(mongoUri, options);
            log.info(`Connected: ${conn.connection.host}`);

            mongoose.connection.on("disconnected", () => {
                log.warn("Disconnected — Mongoose will attempt to reconnect");
            });
            mongoose.connection.on("reconnected", () => {
                log.info("Reconnected");
            });
            mongoose.connection.on("error", (err: Error) => {
                logError(err, { context: "mongoose-connection-error" });
            });

            return;
        } catch (err) {
            const isLastAttempt = attempt === MAX_RETRIES;
            const message = err instanceof Error ? err.message : String(err);

            if (isLastAttempt) {
                logError(err, {
                    context: "mongodb-connect-exhausted",
                    attempts: MAX_RETRIES,
                });
                process.exit(1);
            }

            const delay = INITIAL_DELAY * 2 ** (attempt - 1);
            log.warn(
                `Attempt ${attempt}/${MAX_RETRIES} failed: ${message}. Retrying in ${delay}ms...`,
            );
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};

const disconnectDB = async (): Promise<void> => {
    if (mongoose.connection.readyState === ConnectionStates.disconnected) return;

    try {
        await mongoose.disconnect();
        log.info("Disconnected cleanly");
    } catch (err) {
        logError(err, { context: "mongodb-disconnect" });
        throw err;
    }
};

export { connectDB, disconnectDB };
