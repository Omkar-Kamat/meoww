import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { randomInt, randomBytes } from "crypto";
import User from "../user/user.model.js";
import OTP from "../otp/otp.model.js";
import PasswordReset from "./passwordReset.model.js";
import * as emailService from "../../services/email.service.js";
import { AppError } from "../../utils/AppError.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
    });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    });
    return { accessToken, refreshToken };
};

const generateOTP = () => randomInt(100000, 1000000).toString();

const generateResetToken = () => randomBytes(32).toString("hex");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signup = async (name, username, email, password, profileImage) => {
    email = email.toLowerCase();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
        if (existingUser.email === email) {
            throw AppError.conflict("Email already exists", "EMAIL_EXISTS");
        }
        if (existingUser.username === username) {
            throw AppError.conflict("Username already exists", "USERNAME_EXISTS");
        }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;

    try {
        user = await User.create({
            name,
            username,
            email,
            passwordHash,
            profileImage,
            isVerified: false,
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0];
            if (field === "email") throw AppError.conflict("Email already exists", "EMAIL_EXISTS");
            if (field === "username") throw AppError.conflict("Username already exists", "USERNAME_EXISTS");
            throw AppError.conflict("Duplicate key error", "DUPLICATE_ERROR");
        }
        throw err;
    }

    try {
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        await OTP.create({
            userId: user._id,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        await emailService.sendOTPEmail(email, otp);
    } catch {
        await User.findByIdAndDelete(user._id);
        throw AppError.internal(
            "Failed to send verification email. Please try again.",
            "EMAIL_SEND_FAILED"
        );
    }

    const userObj = user.toObject();
    delete userObj.passwordHash;
    return userObj;
};

export const login = async (email, password) => {
    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) throw AppError.unauthorized("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw AppError.unauthorized("Invalid credentials");

    if (!user.isVerified) {
        throw AppError.forbidden("Email not verified", "EMAIL_NOT_VERIFIED", {
            userId: user._id,
        });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokenHash;
    return { user: userObj, accessToken, refreshToken };
};

export const verify = async (userId, otp) => {
    const objectId = new mongoose.Types.ObjectId(userId);
    const otpRecord = await OTP.findOne({ userId: objectId }).lean();

    if (!otpRecord) throw AppError.badRequest("OTP not found or expired");
    if (otpRecord.expiresAt < new Date()) throw AppError.badRequest("OTP expired");

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isMatch) throw AppError.badRequest("Invalid OTP");

    const { accessToken, refreshToken } = generateTokens(userId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const user = await User.findByIdAndUpdate(
        objectId,
        { isVerified: true, refreshTokenHash },
        { new: true }
    );
    if (!user) throw AppError.notFound("User not found");

    await OTP.deleteMany({ userId: objectId });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshTokenHash;
    return { user: userObj, accessToken, refreshToken };
};

export const resendOtp = async (userId) => {
    const objectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(objectId);
    if (!user) throw AppError.notFound("User not found");
    if (user.isVerified) throw AppError.badRequest("User is already verified");

    await OTP.deleteMany({ userId: objectId });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.create({
        userId: objectId,
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await emailService.sendOTPEmail(user.email, otp);
};

export const refresh = async (refreshToken) => {
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw AppError.unauthorized("Invalid refresh token");
    }

    const user = await User.findOneAndUpdate(
        { _id: decoded.userId, refreshTokenHash: { $ne: null } },
        { refreshTokenHash: null },
        { new: false }
    );

    if (!user || !user.refreshTokenHash) {
        throw AppError.unauthorized(
            "Session invalid or already rotated. Please login again."
        );
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
        throw AppError.unauthorized("Token reuse detected. Session invalidated.");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await User.findByIdAndUpdate(user._id, {
        refreshTokenHash: newRefreshTokenHash,
    });

    return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

export const getUserProfile = async (userId) => {
    const user = await User.findById(userId).select("-passwordHash -refreshTokenHash");
    if (!user) throw AppError.notFound("User not found");
    return user;
};

// ─── Password reset ───────────────────────────────────────────────────────────

export const forgotPassword = async (email) => {
    email = email.toLowerCase();
    const user = await User.findOne({ email });

    // Silently return — do not leak whether the email exists
    if (!user) return;

    await PasswordReset.deleteMany({ userId: user._id });

    const rawToken  = generateResetToken();
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await PasswordReset.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Pass userId so the email link includes it — enables O(1) lookup on reset
    await emailService.sendPasswordResetEmail(email, rawToken, user._id.toString());
};

export const resetPassword = async (userId, rawToken, newPassword) => {
    // Direct lookup by userId — always exactly one record per user.
    // No scan, no loop, one bcrypt.compare.
    const objectId    = new mongoose.Types.ObjectId(userId);
    const resetRecord = await PasswordReset.findOne({
        userId:    objectId,
        expiresAt: { $gt: new Date() },
    }).lean();

    if (!resetRecord) {
        throw AppError.badRequest(
            "Reset link is invalid or has expired.",
            "INVALID_RESET_TOKEN"
        );
    }

    const isMatch = await bcrypt.compare(rawToken, resetRecord.tokenHash);
    if (!isMatch) {
        throw AppError.badRequest(
            "Reset link is invalid or has expired.",
            "INVALID_RESET_TOKEN"
        );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(objectId, {
        passwordHash:     newPasswordHash,
        refreshTokenHash: null, // invalidate all sessions
    });

    await PasswordReset.deleteMany({ userId: objectId });
};