import { vi } from "vitest";

process.env.ALLOWED_ORIGINS = "http://localhost:3000";
process.env.JWT_ACCESS_SECRET = "supersecretaccesskeythathas32chars!";
process.env.JWT_REFRESH_SECRET = "supersecretrefreshkeythathas32chars!";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.CLOUDINARY_CLOUD_NAME = "mock";
process.env.CLOUDINARY_API_KEY = "mock";
process.env.CLOUDINARY_API_SECRET = "mock";
process.env.MONGO_URI = "mongodb://localhost:27017/test"; // Overridden later
process.env.BREVO_API_KEY = "mockkey";
process.env.EMAIL_FROM = "test@example.com";
process.env.BASE_URL = "http://localhost:5000";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_PASSWORD = "mock";

// Mock redis
vi.mock("./src/config/redis.js", () => {
    const mockStore = new Map();
    return {
        default: {
            get: vi.fn(async (k) => mockStore.get(k) ?? null),
            set: vi.fn(async (k, v) => mockStore.set(k, v)),
            setEx: vi.fn(async (k, t, v) => mockStore.set(k, v)),
            del: vi.fn(async (k) => mockStore.delete(k)),
            sendCommand: vi.fn(async () => []),
        },
    };
});

// Mock email service
vi.mock("./src/services/email.service.js", () => {
    return {
        sendVerificationEmail: vi.fn(async () => {}),
        sendPasswordResetEmail: vi.fn(async () => {}),
        sendEmail: vi.fn(async () => {}),
    };
});

// Mock rate limiters
vi.mock("./src/middleware/rateLimit.middleware.js", () => {
    const dummy = (req: any, res: any, next: any) => next();
    return {
        createRateLimiter: vi.fn(() => dummy),
        authRateLimiter: dummy,
        apiRateLimiter: dummy,
        resetPasswordRateLimiter: dummy,
        otpRateLimiter: dummy,
    };
});
