import mongoose from "mongoose";

const MAX_RETRIES   = 5;
const INITIAL_DELAY = 1000; // 1s, doubles each attempt up to ~16s

const connectDB = async () => {
    mongoose.set("strictQuery", true);

    // Connection pool + timeout tuning for production
    const options = {
        maxPoolSize:              10,
        serverSelectionTimeoutMS: 5000,  // give up selecting a server after 5s
        socketTimeoutMS:          45000, // close sockets idle for 45s
        heartbeatFrequencyMS:     10000, // check server health every 10s
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, options);
            console.log(`[MongoDB] Connected: ${conn.connection.host}`);

            // Log unexpected disconnections so they're visible in CloudWatch/logs
            mongoose.connection.on("disconnected", () =>
                console.warn("[MongoDB] Disconnected — Mongoose will attempt to reconnect")
            );
            mongoose.connection.on("reconnected", () =>
                console.log("[MongoDB] Reconnected")
            );
            mongoose.connection.on("error", (err) =>
                console.error("[MongoDB] Connection error:", err.message)
            );

            return; // connected — exit the retry loop
        } catch (err) {
            const isLastAttempt = attempt === MAX_RETRIES;

            if (isLastAttempt) {
                console.error(`[MongoDB] All ${MAX_RETRIES} connection attempts failed. Exiting.`);
                process.exit(1);
            }

            const delay = INITIAL_DELAY * 2 ** (attempt - 1); // 1s, 2s, 4s, 8s, 16s
            console.warn(
                `[MongoDB] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${delay}ms...`
            );
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};

export default connectDB;