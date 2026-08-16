// createUser(data: SignupInput): Promise<UserDocument>
// verifyCredentials(email: string, password: string): Promise<UserDocument>
// generateAccessToken(userId: string): string
// generateRefreshToken(userId: string): string
// verifyRefreshToken(token: string): { userId: string }
// createPasswordResetToken(userId: string): Promise<string>
// consumePasswordResetToken(token: string, newPassword: string): Promise<void>

// src/modules/auth/auth.service
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload as JsonWebTokenPayload, type SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { Types } from "mongoose";
import UserModel, { type UserDocument, type UserFields } from "../user/user.model.js";
import { PasswordResetModel } from "./auth.model.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import type { SignupInput } from "./auth.types.js";

export async function createUser(data: SignupInput): Promise<UserDocument> {
    const email = data.email.toLowerCase();

    const existingUser = await UserModel.findOne({
        $or: [{ email }, { username: data.username }],
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw AppError.conflict("Email already exists", "EMAIL_EXISTS");
        }
        throw AppError.conflict("Username already exists", "USERNAME_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser: Partial<UserFields> = {
        name: data.name,
        username: data.username,
        email,
        passwordHash,
        isVerified: false,
        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    };

    try {
        const user = await UserModel.create(newUser);
        return user;
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            const field = Object.keys(err.keyPattern ?? {})[0];
            if (field === "email") throw AppError.conflict("Email already exists", "EMAIL_EXISTS");
            if (field === "username")
                throw AppError.conflict("Username already exists", "USERNAME_EXISTS");
            throw AppError.conflict("Duplicate key error", "DUPLICATE_ERROR");
        }
        throw err;
    }
}

export async function verifyCredentials(email: string, password: string): Promise<UserDocument> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw AppError.unauthorized("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw AppError.unauthorized("Invalid credentials");
    }

    if (!user.isVerified) {
        throw AppError.forbidden("Email not verified", "EMAIL_NOT_VERIFIED", {
            userId: String(user._id),
        });
    }

    return user;
}

export function generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRY,
    } as SignOptions);
}

export function generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.REFRESH_TOKEN_EXPIRY,
    } as SignOptions);
}

export function verifyRefreshToken(token: string): { userId: string } {
    let decoded: string | JsonWebTokenPayload;

    try {
        decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
        throw AppError.unauthorized("Invalid refresh token");
    }

    if (
        typeof decoded === "string" ||
        !("userId" in decoded) ||
        typeof decoded.userId !== "string"
    ) {
        throw AppError.unauthorized("Invalid refresh token payload");
    }

    return { userId: decoded.userId };
}

export async function markUserVerified(userId: string): Promise<UserDocument> {
    const user = await UserModel.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
    if (!user) {
        throw AppError.notFound("User not found");
    }
    return user;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
    const objectId = new Types.ObjectId(userId);

    await PasswordResetModel.deleteMany({ userId: objectId });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await PasswordResetModel.create({
        userId: objectId,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    return rawToken;
}

export async function consumePasswordResetToken(token: string, newPassword: string): Promise<void> {
    const candidates = await PasswordResetModel.find({ expiresAt: { $gt: new Date() } });

    let matchedUserId: Types.ObjectId | undefined;

    for (const candidate of candidates) {
        const isMatch = await bcrypt.compare(token, candidate.tokenHash);
        if (isMatch) {
            matchedUserId = candidate.userId;
            break;
        }
    }

    if (!matchedUserId) {
        throw AppError.badRequest("Reset link is invalid or has expired.", "INVALID_RESET_TOKEN");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await UserModel.findByIdAndUpdate(matchedUserId, {
        passwordHash: newPasswordHash,
        refreshTokenHash: null,
    });

    await PasswordResetModel.deleteMany({ userId: matchedUserId });
}

function isDuplicateKeyError(
    err: unknown,
): err is { code: number; keyPattern?: Record<string, unknown> } {
    return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}
