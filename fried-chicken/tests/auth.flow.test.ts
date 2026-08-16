import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Mock email service
vi.mock("../src/services/email.service.js", () => {
    return {
        sendVerificationEmail: vi.fn(async () => {}),
        sendPasswordResetEmail: vi.fn(async () => {}),
        sendEmail: vi.fn(async () => {}),
    };
});
import { createApp } from "../src/app.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../src/services/email.service.js";
import UserModel from "../src/modules/user/user.model.js";
import { TokenModel } from "../src/modules/token/token.model.js";
import otpModel from "../src/modules/otp/otp.model.js";

describe("Auth Flow", () => {
    let mongoServer: MongoMemoryServer;
    let app: any;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        app = createApp();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        await TokenModel.deleteMany({});
        await otpModel.deleteMany({});
        vi.clearAllMocks();
    });

    it("should complete the full auth flow", async () => {
        // 1. Signup
        const signupRes = await request(app).post("/api/auth/signup").send({
            name: "Test User",
            username: "testuser123",
            email: "test@example.com",
            password: "password123",
        });

        if (signupRes.status !== 201) {
            console.error("SIGNUP FAILED:", signupRes.body);
        }
        expect(signupRes.status).toBe(201);
        expect(signupRes.body).toHaveProperty("message");
        
        expect(sendVerificationEmail).toHaveBeenCalled();
        const code = (sendVerificationEmail as any).mock.calls[0][1];

        // 2. Verify
        const verifyRes = await request(app).post("/api/auth/verify").send({
            identifier: "test@example.com",
            code: code,
        });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.user.isVerified).toBe(true);

        const cookies = verifyRes.headers["set-cookie"];
        expect(cookies).toBeDefined();

        // 3. Login
        const loginRes = await request(app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "password123",
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.user.email).toBe("test@example.com");

        // 4. Forgot Password
        const forgotRes = await request(app).post("/api/auth/forgot-password").send({
            email: "test@example.com",
        });

        expect(forgotRes.status).toBe(200);
        expect(sendPasswordResetEmail).toHaveBeenCalled();
        const resetLink = (sendPasswordResetEmail as any).mock.calls[0][1];
        
        const url = new URL(resetLink);
        const userId = url.searchParams.get("userId");
        const token = url.searchParams.get("token");

        expect(userId).toBeTruthy();
        expect(token).toBeTruthy();

        // 5. Reset Password
        const resetRes = await request(app).post("/api/auth/reset-password").send({
            userId,
            token,
            password: "newpassword123",
        });

        expect(resetRes.status).toBe(200);

        // 6. Login with new password
        const newLoginRes = await request(app).post("/api/auth/login").send({
            email: "test@example.com",
            password: "newpassword123",
        });

        expect(newLoginRes.status).toBe(200);
    const dummy = (req: any, res: any, next: any) => next();
    return {
        createRateLimiter: vi.fn(() => dummy),
        authRateLimiter: dummy,
        apiRateLimiter: dummy,
        resetPasswordRateLimiter: dummy,
        otpRateLimiter: dummy,
    };
});
});
