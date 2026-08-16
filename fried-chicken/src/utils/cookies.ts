import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

const isProd = env.NODE_ENV === "production";
const isCrossSite = env.CROSS_SITE;

export const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    path: "/",
    sameSite: isProd ? (isCrossSite ? "none" : "strict") : "lax",
};

export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: COOKIE_OPTIONS.secure,
    path: "/",
    sameSite: COOKIE_OPTIONS.sameSite,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie("access_token", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie("refresh_token", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

export function clearAuthCookies(res: Response): void {
    res.clearCookie("access_token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);
}
