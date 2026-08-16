// router — exported Express router wiring the above controller methods to paths (POST /signup, POST /login, etc.)

// src/modules/auth/auth.routes
import express, { type Router } from "express";
import * as authController from "./auth.controller.js";
import { upload } from "../../config/cloudinary.js";
import { authRateLimiter, apiRateLimiter } from "../../middleware/rateLimit.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "./auth.schema.js";
import { otpVerifySchema, otpRequestSchema } from "../otp/otp.schema.js";

const router: Router = express.Router();

router.post(
    "/signup",
    authRateLimiter,
    upload.single("profilePhoto"),
    validateBody(signupSchema),
    authController.signup,
);

router.post(
    "/verify",
    authRateLimiter,
    validateBody(otpVerifySchema),
    authController.verifySignupOtp,
);

router.post(
    "/resend-verification",
    authRateLimiter,
    validateBody(otpRequestSchema),
    authController.resendSignupOtp,
);

router.post("/login", authRateLimiter, validateBody(loginSchema), authController.login);

router.post(
    "/forgot-password",
    authRateLimiter,
    validateBody(forgotPasswordSchema),
    authController.forgotPassword,
);

router.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);

router.post("/refresh", apiRateLimiter, authController.refreshToken);

router.post("/logout", authController.logout);

export default router;
