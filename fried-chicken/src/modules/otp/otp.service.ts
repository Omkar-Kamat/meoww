import { createToken, consumeToken, invalidateToken } from "../token/token.service.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const PURPOSE = "email-verify";

export async function generateOtp(identifier: string): Promise<string> {
    return createToken({
        purpose: PURPOSE,
        identifier,
        ttlMs: OTP_EXPIRY_MS,
        numeric: true,
    });
}

export async function verifyOtp(identifier: string, code: string): Promise<boolean> {
    return consumeToken(PURPOSE, identifier, code);
}

export async function invalidateOtp(identifier: string): Promise<void> {
    await invalidateToken(PURPOSE, identifier);
}
