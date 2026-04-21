import User from "./user.model.js";
import { AppError } from "../../utils/AppError.js";

/**
 * Updates a user's profile fields.
 *
 * - `name` and `username` come from the request body (both optional).
 * - `profileImage` is a Cloudinary URL, already uploaded by the controller
 *   before this service is called (keeps upload logic out of the service).
 *
 * Only the fields explicitly passed are updated — undefined fields are
 * stripped before the DB call so we never accidentally overwrite with null.
 */
export const updateProfile = async (userId, { name, username, profileImage }) => {
    // ── Username uniqueness check ─────────────────────────────────────────────
    // We need to check before the update to give a clear error message.
    // A unique index violation would also catch this, but the 11000 error
    // is harder to surface cleanly when mixed with other update errors.
    if (username) {
        const existing = await User.findOne({ username });
        // Allow the user to "re-submit" their own current username without error
        if (existing && existing._id.toString() !== userId) {
            throw AppError.conflict("Username already taken", "USERNAME_TAKEN");
        }
    }

    // Build the update object with only the fields that were actually provided.
    // Spreading undefined values would leave keys with undefined, which
    // Mongoose would interpret as unsetting the field.
    const updates = {};
    if (name !== undefined)         updates.name = name;
    if (username !== undefined)     updates.username = username;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        {
            new: true,           // return the updated document
            runValidators: true, // enforce schema-level constraints (minlength etc.)
        }
    ).select("-passwordHash -refreshTokenHash");

    if (!user) throw AppError.notFound("User not found");

    return user;
};

/**
 * Permanently deletes a user account and all associated data.
 * Called from DELETE /api/users/me.
 */
export const deleteAccount = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw AppError.notFound("User not found");
};