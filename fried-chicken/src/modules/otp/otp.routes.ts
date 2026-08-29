import express, { type Router } from "express";
import * as otpController from "./otp.controller.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { otpRateLimiter } from "../../middleware/rateLimit.middleware.js";
import { otpRequestSchema, otpVerifySchema } from "./otp.schema.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/otp/request:
 *   post:
 *     summary: Request an OTP code
 *     tags: [OTP]
 */
router.post("/request", otpRateLimiter, validateBody(otpRequestSchema), otpController.requestOtp);

/**
 * @swagger
 * /api/otp/verify:
 *   post:
 *     summary: Verify an OTP code
 *     tags: [OTP]
 */
router.post(
    "/verify",
    otpRateLimiter,
    validateBody(otpVerifySchema),
    otpController.verifyOtpHandler,
);

export default router;
