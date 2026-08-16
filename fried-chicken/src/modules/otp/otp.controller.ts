// requestOtp(req, res, next)
// verifyOtpHandler(req, res, next)

// src/modules/otp/otp.controller.ts
import type { NextFunction, Request, Response } from "express";
import * as otpService from "./otp.service.js";
import { sendVerificationEmail } from "../../services/email.service.js";
import type { OtpRequestInput, OtpVerifyInput } from "./otp.types.js";

export async function requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { identifier } = req.body as OtpRequestInput;

        const code = await otpService.generateOtp(identifier);
        await sendVerificationEmail(identifier, code);

        res.json({ message: "Verification code sent." });
    } catch (err) {
        next(err);
    }
}

export async function verifyOtpHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { identifier, code } = req.body as OtpVerifyInput;

        const isValid = await otpService.verifyOtp(identifier, code);

        if (!isValid) {
            res.status(400).json({ success: false, message: "Invalid or expired code." });
            return;
        }

        res.json({ success: true, message: "Code verified." });
    } catch (err) {
        next(err);
    }
}
