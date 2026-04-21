import 'dotenv/config';
import "./src/config/env.js"

import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initSocketServer } from './src/sockets/socket.server.js';
import redisClient from './src/config/redis.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async () => {
    await connectDB();
    await initSocketServer(server);
    server.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// Gives in-flight requests time to finish before the process exits.
// Critical for Docker stop, ECS task replacement, and EC2 reboots —
// without this, active DB writes and WebRTC sessions drop instantly.
const shutdown = async (signal) => {
    console.log(`\n[shutdown] ${signal} received — shutting down gracefully`);

    // Stop accepting new connections first
    server.close(async () => {
        console.log("[shutdown] HTTP server closed");

        try {
            await mongoose.connection.close();
            console.log("[shutdown] MongoDB connection closed");
        } catch (err) {
            console.error("[shutdown] Error closing MongoDB:", err.message);
        }

        try {
            await redisClient.quit();
            console.log("[shutdown] Redis connection closed");
        } catch (err) {
            console.error("[shutdown] Error closing Redis:", err.message);
        }

        console.log("[shutdown] Clean exit");
        process.exit(0);
    });

    // Force exit if graceful shutdown takes longer than 10 seconds.
    // Prevents the process from hanging indefinitely if a connection
    // refuses to close (e.g. a long-polling client or stalled DB query).
    setTimeout(() => {
        console.error("[shutdown] Timeout reached — forcing exit");
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop, ECS, systemd
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C in dev

startServer();