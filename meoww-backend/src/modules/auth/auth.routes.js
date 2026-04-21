import express from "express";
import * as authController from "./auth.controller.js";
import { upload } from "../../config/cloudinary.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";
import {
    authLimiter,
    refreshLimiter,
    resendOtpLimiter,
    turnLimiter,
    signupLimiter,
    forgotPasswordLimiter,
} from "../../middleware/rateLimit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
    signupSchema,
    loginSchema,
    verifySchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "./auth.schema.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               profilePhoto: { type: string, format: binary }
 *     responses:
 *       201: { description: Signup successful }
 *       400: { description: Validation error }
 *       409: { description: Email or username already exists }
 */
router.post(
    "/signup",
    signupLimiter,
    upload.single("profilePhoto"),
    validate(signupSchema),
    authController.signup
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 *       403: { description: Email not verified }
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200: { description: Verification successful }
 *       400: { description: Invalid or expired OTP }
 */
router.post("/verify", validate(verifySchema), authController.verify);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200: { description: OTP resent }
 *       400: { description: User not found or already verified }
 *       429: { description: Too many requests }
 */
router.post("/resend-otp", resendOtpLimiter, validate(resendOtpSchema), authController.resendOtp);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent (or silently no-op if email not found) }
 *       429: { description: Too many requests }
 */
router.post(
    "/forgot-password",
    forgotPasswordLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a token from the reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string, description: "64-char hex token from email link" }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password reset successful, all sessions invalidated }
 *       400: { description: Invalid or expired token }
 */
router.post(
    "/reset-password",
    validate(resetPasswordSchema),
    authController.resetPassword
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Tokens refreshed }
 *       401: { description: Invalid or expired refresh token }
 */
router.post("/refresh", refreshLimiter, authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: User profile }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.get("/me", verifyAccessToken, authController.getMe);

/**
 * @swagger
 * /api/auth/turn-credentials:
 *   get:
 *     summary: Get ephemeral TURN credentials
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: TURN credentials }
 *       500: { description: Failed to fetch credentials }
 */
router.get("/turn-credentials", verifyAccessToken, turnLimiter, authController.getTurnCredentials);

export default router;