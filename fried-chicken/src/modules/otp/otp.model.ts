// OtpModel — exported Mongoose model (code, userId/email, expiresAt, attempts)

// src/modules/otp/otp.model.ts
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface OtpFields {
    identifier: string;
    codeHash: string;
    expiresAt: Date;
    attempts: number;
}

export interface OtpDocument extends OtpFields, Document {}

const otpSchema = new Schema<OtpDocument>({
    identifier: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
});

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.index({ identifier: 1 });

export const OtpModel: Model<OtpDocument> = mongoose.model<OtpDocument>("Otp", otpSchema);
export default OtpModel;
