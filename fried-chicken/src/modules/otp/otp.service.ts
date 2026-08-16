// generateOtp(identifier: string): Promise<string>
// verifyOtp(identifier: string, code: string): Promise<boolean>
// invalidateOtp(identifier: string): Promise<void>

// src/modules/otp/otp.service.ts
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { OtpModel } from "./otp.model.js";
import { AppError } from "../../utils/AppError.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function generateOtp(identifier: string): Promise<string> {
    await OtpModel.deleteMany({ identifier });

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await OtpModel.create({
        identifier,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        attempts: 0,
    });

    return code;
}

export async function verifyOtp(identifier: string, code: string): Promise<boolean> {
    const record = await OtpModel.findOne({ identifier });

    if (!record) {
        return false;
    }

    if (record.expiresAt < new Date()) {
        await record.deleteOne();
        return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        await record.deleteOne();
        throw AppError.badRequest(
            "Too many incorrect attempts. Please request a new code.",
            "OTP_LOCKED",
        );
    }

    const isMatch = await bcrypt.compare(code, record.codeHash);

    if (!isMatch) {
        record.attempts += 1;
        await record.save();
        return false;
    }

    await record.deleteOne();
    return true;
}

export async function invalidateOtp(identifier: string): Promise<void> {
    await OtpModel.deleteMany({ identifier });
}
