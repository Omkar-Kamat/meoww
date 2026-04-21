import express from "express";
import * as userController from "./user.controller.js";
import { upload } from "../../config/cloudinary.js";
import { verifyAccessToken } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from "./user.schema.js";
import { updateProfileLimiter } from "../../middleware/rateLimit.middleware.js";

const router = express.Router();

// All user routes require authentication
router.use(verifyAccessToken);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200: { description: Profile updated successfully }
 *       400: { description: Validation error or no fields provided }
 *       401: { description: Not authenticated }
 *       409: { description: Username already taken }
 */
router.patch(
    "/me",
    updateProfileLimiter,
    upload.single("profilePhoto"),
    // Note: validate runs AFTER multer so req.body is populated from
    // the multipart form. If a profilePhoto is the only change, the
    // body will be empty — the controller handles that case explicitly.
    (req, res, next) => {
        // If only a file was uploaded with no text fields, skip body validation
        // (the schema requires at least one body field, but a file-only update
        // is also valid). The controller enforces "something must change".
        if (req.file && Object.keys(req.body).length === 0) {
            return next();
        }
        return validate(updateProfileSchema)(req, res, next);
    },
    userController.updateProfile
);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Permanently delete the authenticated user's account
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Account deleted }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.delete("/me", userController.deleteAccount);

export default router;