// PasswordResetModel — exported Mongoose model (renamed from passwordReset.model.js)

// src/modules/auth/auth.model
import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface PasswordReset extends Document {
    userId: Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
}

const passwordResetSchema = new Schema<PasswordReset>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    tokenHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

passwordResetSchema.index({ userId: 1 });

export const PasswordResetModel: Model<PasswordReset> = mongoose.model<PasswordReset>(
    "PasswordReset",
    passwordResetSchema,
);

export default PasswordResetModel;
