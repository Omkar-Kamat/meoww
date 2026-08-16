// sendEmail(to: string, subject: string, html: string): Promise<void>
// sendVerificationEmail(to: string, code: string): Promise<void>
// sendPasswordResetEmail(to: string, resetLink: string): Promise<void>

// src/services/email.service
import axios from "axios";
import { env } from "../config/env.js";
import { createModuleLogger, logError } from "../utils/logger.js";

const log = createModuleLogger("email");

const brevo = axios.create({
    baseURL: "https://api.brevo.com/v3",
    headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
    },
});

interface EmailSender {
    name: string;
    email: string;
}

const FROM: EmailSender = {
    name: "Meoww",
    email: env.EMAIL_FROM,
};

const emailWrapper = (content: string): string => `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #1B1A55; margin-top: 0;">Meoww</h2>
        ${content}
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
`;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        await brevo.post("/smtp/email", {
            sender: FROM,
            to: [{ email: to }],
            subject,
            htmlContent: html,
        });
        log.info({ to, subject }, "Email sent");
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logError(error, { context: "send-email", to, subject });
        throw error;
    }
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
    const html = emailWrapper(`
        <h3 style="color: #1B1A55;">Verify your account</h3>
        <p>Your one-time verification code is:</p>
        <div style="
            display: inline-block;
            letter-spacing: 8px;
            color: #535C91;
            font-size: 36px;
            font-weight: bold;
            margin: 16px 0;
        ">${code}</div>
        <p style="color: #888; font-size: 13px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
    `);

    await sendEmail(to, "Your Meoww verification code", html);
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const html = emailWrapper(`
        <h3 style="color: #1B1A55;">Reset your password</h3>
        <p>We received a request to reset the password for your Meoww account.</p>
        <a href="${resetLink}" style="
            display: inline-block;
            margin: 20px 0;
            padding: 12px 28px;
            background-color: #535C91;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: 600;
        ">Reset Password</a>
        <p style="color: #888; font-size: 13px;">
            This link expires in <strong>15 minutes</strong>.<br/>
            If the button doesn't work, copy and paste this URL:<br/>
            <span style="color: #535C91; word-break: break-all;">${resetLink}</span>
        </p>
    `);

    await sendEmail(to, "Reset your Meoww password", html);
}
