import mongoose from "mongoose";

/**
 * Stores a bcrypt hash of a password-reset token.
 *
 * Why a separate model instead of fields on User?
 *  - Keeps the User document clean — reset state is transient.
 *  - TTL index auto-deletes expired tokens — no cron job needed.
 *  - One place to query/invalidate all pending resets for a user.
 *
 * Flow:
 *  1. User hits /forgot-password → we create one of these documents.
 *  2. We email the RAW token (never stored).
 *  3. User hits /reset-password with raw token → we bcrypt.compare
 *     against tokenHash, then delete this document and update password.
 */
const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
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

// Auto-delete documents once expiresAt is reached
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup by userId when checking for existing/pending resets
passwordResetSchema.index({ userId: 1 });

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
export default PasswordReset;
