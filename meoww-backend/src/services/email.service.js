import axios from "axios";

const brevo = axios.create({
    baseURL: "https://api.brevo.com/v3",
    headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json",
    },
});

const FROM = {
    name: "Meoww",
    email: process.env.EMAIL_FROM,
};

const emailWrapper = (content) => `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff;">
        <h2 style="color: #1B1A55; margin-top: 0;">Meoww</h2>
        ${content}
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
`;

export const sendOTPEmail = async (toEmail, otp) => {
    await brevo.post("/smtp/email", {
        sender: FROM,
        to: [{ email: toEmail }],
        subject: "Your Meoww verification code",
        htmlContent: emailWrapper(`
            <h3 style="color: #1B1A55;">Verify your account</h3>
            <p>Your one-time verification code is:</p>
            <div style="
                display: inline-block;
                letter-spacing: 8px;
                color: #535C91;
                font-size: 36px;
                font-weight: bold;
                margin: 16px 0;
            ">${otp}</div>
            <p style="color: #888; font-size: 13px;">
                This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
        `),
    });
};

// ── userId added to reset URL so the backend can do a direct lookup ───────────
export const sendPasswordResetEmail = async (toEmail, resetToken, userId) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?userId=${userId}&token=${resetToken}`;

    await brevo.post("/smtp/email", {
        sender: FROM,
        to: [{ email: toEmail }],
        subject: "Reset your Meoww password",
        htmlContent: emailWrapper(`
            <h3 style="color: #1B1A55;">Reset your password</h3>
            <p>We received a request to reset the password for your Meoww account.</p>
            <a href="${resetUrl}" style="
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
                <span style="color: #535C91; word-break: break-all;">${resetUrl}</span>
            </p>
        `),
    });
};