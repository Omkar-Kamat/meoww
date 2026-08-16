import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { TokenModel } from "./token.model.js";
import { AppError } from "../../utils/AppError.js";

const MAX_ATTEMPTS = 5;

interface CreateTokenOptions {
    purpose: string;
    identifier: string;
    ttlMs: number;
    numeric?: boolean;
}

export async function createToken(options: CreateTokenOptions): Promise<string> {
    const { purpose, identifier, ttlMs, numeric = false } = options;


    await TokenModel.deleteMany({ purpose, identifier });

    const raw = numeric
        ? String(Math.floor(100000 + Math.random() * 900000))
        : randomBytes(32).toString("hex");

    const tokenHash = await bcrypt.hash(raw, 10);

    await TokenModel.create({
        purpose,
        identifier,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMs),
        attempts: 0,
    });

    return raw;
}

export async function consumeToken(
    purpose: string,
    identifier: string,
    rawToken: string
): Promise<boolean> {
    const record = await TokenModel.findOne({ purpose, identifier });

    if (!record) return false;

    if (record.expiresAt < new Date()) {
        await record.deleteOne();
        return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        await record.deleteOne();
        throw AppError.badRequest("Too many incorrect attempts. Please request a new one.", "TOKEN_LOCKED");
    }

    const isMatch = await bcrypt.compare(rawToken, record.tokenHash);

    if (!isMatch) {
        record.attempts += 1;
        await record.save();
        return false;
    }

    await record.deleteOne();
    return true;
}

export async function invalidateToken(purpose: string, identifier: string): Promise<void> {
    await TokenModel.deleteMany({ purpose, identifier });
}