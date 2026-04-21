import jwt from "jsonwebtoken";
import axios from "axios";
import * as authService from "./auth.service.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import { AppError } from "../../utils/AppError.js";
import redisClient from "../../config/redis.js";

const isProd      = process.env.NODE_ENV === "production";
const isCrossSite = process.env.CROSS_SITE === "true";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure:   isProd,
    path:     "/",
    sameSite: isProd ? (isCrossSite ? "none" : "strict") : "lax",
};

const CLEAR_COOKIE_OPTIONS = {
    httpOnly: true,
    secure:   COOKIE_OPTIONS.secure,
    path:     "/",
    sameSite: COOKIE_OPTIONS.sameSite,
};

const setAuthCookies = (res, accessToken, refreshToken) => {
    res.cookie("access_token", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const signup = async (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;
        let profileImage = "";
        if (req.file) {
            profileImage = await uploadToCloudinary(req.file.buffer);
        }
        const user = await authService.signup(name, username, email, password, profileImage);
        res.status(201).json({
            message: "Signup successful. Please verify your email.",
            userId:  user._id,
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        setAuthCookies(res, accessToken, refreshToken);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

export const verify = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;
        const { user, accessToken, refreshToken } = await authService.verify(userId, otp);
        setAuthCookies(res, accessToken, refreshToken);
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

export const resendOtp = async (req, res, next) => {
    try {
        const { userId } = req.body;
        await authService.resendOtp(userId);
        res.json({ message: "OTP resent successfully. Please check your email." });
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies.refresh_token;
        if (!oldRefreshToken) {
            return next(AppError.unauthorized("No refresh token provided"));
        }
        const { accessToken, refreshToken: newRefreshToken } =
            await authService.refresh(oldRefreshToken);
        setAuthCookies(res, accessToken, newRefreshToken);
        res.json({ message: "Token refreshed" });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            if (decoded?.userId) {
                await authService.logout(decoded.userId);
            }
        } catch {
            // Invalid/expired token — still clear cookies
        }
    }
    res.clearCookie("access_token",  CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);
    res.json({ message: "Logged out successfully" });
};

export const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserProfile(req.user.userId);
        res.json(user);
    } catch (err) {
        next(err);
    }
};

// ── TURN credentials ──────────────────────────────────────────────────────────
const TURN_CACHE_KEY = "turn:credentials";
// Metered TURN credentials are valid for 24h — cache for 23h so we always
// serve fresh credentials before they expire. On cache miss or Metered failure
// we fall back to STUN-only so users can still connect (without relay support).
const TURN_CACHE_TTL = 23 * 60 * 60; // seconds

export const getTurnCredentials = async (req, res, next) => {
    try {
        // ── Cache hit ─────────────────────────────────────────────────────────
        const cached = await redisClient.get(TURN_CACHE_KEY);
        if (cached) {
            return res.json({ iceServers: JSON.parse(cached) });
        }

        // ── Cache miss — fetch from Metered ───────────────────────────────────
        const response = await axios.get(
            `https://${process.env.METERED_DOMAIN}/api/v1/turn/credentials`,
            {
                params:  { apiKey: process.env.METERED_API_KEY },
                timeout: 5000,
            }
        );

        const iceServers = response.data;

        // Store in Redis — fire and forget, don't block the response
        redisClient
            .set(TURN_CACHE_KEY, JSON.stringify(iceServers), { EX: TURN_CACHE_TTL })
            .catch((err) => console.error("[TURN] Failed to cache credentials:", err.message));

        return res.json({ iceServers });
    } catch (err) {
        // ── Metered is down — fall back to STUN only ──────────────────────────
        // Users behind symmetric NATs won't be able to connect, but everyone
        // else can. Better than a hard 500 that blocks all new connections.
        console.error("[TURN] Failed to fetch credentials:", err.message);
        return res.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ],
        });
    }
};

// ─── Password reset ───────────────────────────────────────────────────────────

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        res.json({
            message: "If an account with that email exists, a reset link has been sent.",
        });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { userId, token, password } = req.body;
        await authService.resetPassword(userId, token, password);

        res.clearCookie("access_token",  CLEAR_COOKIE_OPTIONS);
        res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);

        res.json({
            message: "Password reset successful. Please log in with your new password.",
        });
    } catch (err) {
        next(err);
    }
};