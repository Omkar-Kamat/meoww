import * as userService from "./user.service.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import { AppError } from "../../utils/AppError.js";

/**
 * PATCH /api/users/me
 *
 * Updates the authenticated user's profile.
 * Accepts multipart/form-data so the profile image can be uploaded
 * in the same request as the text fields.
 *
 * Any combination of fields can be sent — all are optional.
 * Sending no fields at all returns a 400 (enforced by the Zod schema).
 */
export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name, username } = req.body;

        // Upload new avatar to Cloudinary if one was provided.
        // We do this in the controller (not service) because it's an
        // infrastructure concern — the service only deals with DB state.
        let profileImage;
        if (req.file) {
            profileImage = await uploadToCloudinary(req.file.buffer);
        }

        // If no file and no body fields, the Zod schema will have already
        // rejected the request before we get here. But if somehow only a
        // file was sent (no body fields), we still need to allow it.
        if (!req.file && !name && !username) {
            return next(AppError.badRequest("At least one field must be provided"));
        }

        const user = await userService.updateProfile(userId, {
            name,
            username,
            profileImage,
        });

        res.json({ user });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/users/me
 *
 * Permanently deletes the authenticated user's account.
 * Clears auth cookies so the client is immediately logged out.
 *
 * Note: This does not cascade-delete related data (chat history, etc.)
 * since this app doesn't persist chat — add cascade deletes here as
 * more models are added.
 */
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await userService.deleteAccount(userId);

        // Clear auth cookies — the account is gone, session is meaningless
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? process.env.CROSS_SITE === "true"
                        ? "none"
                        : "strict"
                    : "lax",
        };

        res.clearCookie("access_token", cookieOpts);
        res.clearCookie("refresh_token", cookieOpts);

        res.json({ message: "Account deleted successfully." });
    } catch (err) {
        next(err);
    }
};