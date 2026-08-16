// router — exported Express router (POST /request, POST /verify)

// src/modules/otp/otp.routes.ts
import express, { type Router } from "express";
import * as otpController from "./otp.controller.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";
import { otpRequestSchema, otpVerifySchema } from "./otp.schema.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/otp/request:
 *   post:
 *     summary: Request an OTP code
 *     tags: [OTP]
 */
router.post("/request", authRateLimiter, validateBody(otpRequestSchema), otpController.requestOtp);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [OTP]
 */
router.post(
    "/verify",
    authRateLimiter,
    validateBody(otpVerifySchema),
    otpController.verifyOtpHandler,
);

export default router;
