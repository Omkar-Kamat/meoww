import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface TokenFields {
    purpose: string;
    identifier: string;
    tokenHash: string;
    expiresAt: Date;
    attempts: number;
}

export interface TokenDocument extends TokenFields, Document {}

const tokenSchema = new Schema<TokenDocument>({
    purpose: { type: String, required: true },
    identifier: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ purpose: 1, identifier: 1 });

export const TokenModel: Model<TokenDocument> = mongoose.model<TokenDocument>("Token", tokenSchema);
