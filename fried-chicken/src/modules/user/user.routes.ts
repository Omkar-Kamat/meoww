import express, { type Router } from "express";
import * as userController from "./user.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { upload } from "../../config/cloudinary.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { apiRateLimiter } from "../../middleware/rateLimit.middleware.js";
import { updateUserSchema } from "./user.schema.js";

const router: Router = express.Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: User profile }
 *       401: { description: Not authenticated }
 *       404: { description: User not found }
 */
router.get("/me", requireAuth, userController.getProfile);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update the authenticated user's name/username
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Profile updated }
 *       400: { description: Validation error }
 *       409: { description: Username already taken }
 */
router.patch(
    "/me",
    requireAuth,
    apiRateLimiter,
    validateBody(updateUserSchema),
    userController.updateProfile,
);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Upload/replace the authenticated user's avatar
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar updated }
 *       400: { description: No file provided or invalid file type }
 */
router.post(
    "/me/avatar",
    requireAuth,
    apiRateLimiter,
    upload.single("avatar"),
    userController.uploadAvatar,
);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Permanently delete the authenticated user's account
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200: { description: Account deleted }
 *       401: { description: Not authenticated }
 */
router.delete("/me", requireAuth, userController.deleteAccount);

export default router;
