// signup(req, res, next)
// login(req, res, next)
// logout(req, res, next)
// refreshToken(req, res, next)
// forgotPassword(req, res, next)
// resetPassword(req, res, next)

// src/modules/auth/auth.controller
import type { CookieOptions, NextFunction, Request, Response } from "express";
import * as authService from "./auth.service.js";
import * as otpService from "../otp/otp.service.js";
import { type UserDocument, type UserFields, toPublicUser } from "../user/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { uploadBufferToCloudinary } from "../../utils/uploadHelper.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../services/email.service.js";
import { env } from "../../config/env.js";
import type { LoginInput, SignupInput } from "./auth.types.js";
import { resetPasswordSchema } from "./auth.schema.js";
import { z } from "zod";

const isProd = env.NODE_ENV === "production";
const isCrossSite = env.CROSS_SITE;

const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    path: "/",
    sameSite: isProd ? (isCrossSite ? "none" : "strict") : "lax",
};

const CLEAR_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: COOKIE_OPTIONS.secure,
    path: "/",
    sameSite: COOKIE_OPTIONS.sameSite,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie("access_token", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie("refresh_token", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

/**
 * POST /api/auth/signup
 *
 * Creates the account as unverified, sends an OTP to the given email,
 * and does NOT log the user in yet. Login is gated on isVerified
 * (enforced in auth.service.verifyCredentials). The client should
 * redirect to a "check your email" / OTP entry screen.
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = req.body as SignupInput;

        let profileImage: string | undefined;
        if (req.file) {
            profileImage = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        }

        const user = await authService.createUser({
            ...data,
            ...(profileImage !== undefined && { profileImage }),
        });

        const code = await otpService.generateOtp(user.email);
        await sendVerificationEmail(user.email, code);

        res.status(201).json({
            message: "Signup successful. Please check your email for a verification code.",
            userId: String(user._id),
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/verify
 *
 * Confirms the OTP sent at signup, marks the account verified,
 * and logs the user in (sets auth cookies) on success.
 */
export async function verifySignupOtp(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { identifier, code } = req.body as { identifier: string; code: string };

        const isValid = await otpService.verifyOtp(identifier, code);
        if (!isValid) {
            throw AppError.badRequest("Invalid or expired code.", "INVALID_OTP");
        }

        const user = await authService.findUserByEmail(identifier);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const verifiedUser = await authService.markUserVerified(String(user._id));

        const accessToken = authService.generateAccessToken(String(verifiedUser._id));
        const refreshToken = authService.generateRefreshToken(String(verifiedUser._id));
        setAuthCookies(res, accessToken, refreshToken);

        res.json({ message: "Email verified.", user: toPublicUser(verifiedUser) });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendSignupOtp(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { identifier } = req.body as { identifier: string };

        const user = await authService.findUserByEmail(identifier);
        // Same "don't leak account existence" pattern as forgotPassword
        if (user && !user.isVerified) {
            const code = await otpService.generateOtp(user.email);
            await sendVerificationEmail(user.email, code);
        }

        res.json({
            message: "If an unverified account with that email exists, a new code has been sent.",
        });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body as LoginInput;
        const user = await authService.verifyCredentials(email, password);
        const accessToken = authService.generateAccessToken(String(user._id));
        const refreshToken = authService.generateRefreshToken(String(user._id));
        setAuthCookies(res, accessToken, refreshToken);
        res.json({ user: toPublicUser(user) });
    } catch (err) {
        next(err);
    }
}

export function logout(req: Request, res: Response, _next: NextFunction): void {
    res.clearCookie("access_token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);
    res.json({ message: "Logged out successfully" });
}

export function refreshToken(req: Request, res: Response, next: NextFunction): void {
    try {
        const oldRefreshToken = (req.cookies as Record<string, string> | undefined)?.refresh_token;
        if (!oldRefreshToken) {
            next(AppError.unauthorized("No refresh token provided"));
            return;
        }
        const { userId } = authService.verifyRefreshToken(oldRefreshToken);
        const accessToken = authService.generateAccessToken(userId);
        const newRefreshToken = authService.generateRefreshToken(userId);
        setAuthCookies(res, accessToken, newRefreshToken);
        res.json({ message: "Token refreshed" });
    } catch (err) {
        next(err);
    }
}

export async function forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { email } = req.body as { email: string };
        const user = await authService.findUserByEmail(email);

        if (user) {
            const token = await authService.createPasswordResetToken(String(user._id));
            const frontendUrl = env.FRONTEND_URL ?? "http://localhost:3000";
            const resetLink = `${frontendUrl}/reset-password?userId=${user._id}&token=${token}`;
            try {
                await sendPasswordResetEmail(user.email, resetLink);
            } catch (err) {
                // Swallow email errors so we don't leak account existence
            }
        }

        res.json({
            message: "If an account with that email exists, a reset link has been sent.",
        });
    } catch (err) {
        next(err);
    }
}

export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { userId, token, password } = req.body as z.infer<typeof resetPasswordSchema>;
        await authService.consumePasswordResetToken(userId, token, password);

        res.clearCookie("access_token", CLEAR_COOKIE_OPTIONS);
        res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);

        res.json({
            message: "Password reset successful. Please log in with your new password.",
        });
    } catch (err) {
        next(err);
    }
}
