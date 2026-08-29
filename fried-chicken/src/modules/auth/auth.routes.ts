import express, { type Router } from "express";
import * as authController from "./auth.controller.js";
import { upload } from "../../config/cloudinary.js";
import {
    authRateLimiter,
    apiRateLimiter,
    resetPasswordRateLimiter,
    otpRateLimiter,
} from "../../middleware/rateLimit.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "./auth.schema.js";
import { otpVerifySchema, otpRequestSchema } from "../otp/otp.schema.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post(
    "/signup",
    authRateLimiter,
    upload.single("profilePhoto"),
    validateBody(signupSchema),
    authController.signup,
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify signup OTP
 *     tags: [Auth]
 */
router.post(
    "/verify",
    otpRateLimiter,
    validateBody(otpVerifySchema),
    authController.verifySignupOtp,
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification OTP
 *     tags: [Auth]
 */
router.post(
    "/resend-verification",
    otpRateLimiter,
    validateBody(otpRequestSchema),
    authController.resendSignupOtp,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 */
router.post(
    "/forgot-password",
    authRateLimiter,
    validateBody(forgotPasswordSchema),
    authController.forgotPassword,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 */
router.post(
    "/reset-password",
    resetPasswordRateLimiter,
    validateBody(resetPasswordSchema),
    authController.resetPassword,
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post("/refresh", apiRateLimiter, authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post("/logout", authController.logout);

export default router;
