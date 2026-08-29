import type { NextFunction, Request, Response } from "express";
import * as userService from "./user.service.js";
import { toPublicUser } from "./user.model.js";
import { uploadBufferToCloudinary } from "../../utils/uploadHelper.js";
import { AppError } from "../../utils/AppError.js";
import type { UpdateUserInput } from "./user.types.js";
import { clearAuthCookies } from "../../utils/cookies.js";

function requireUserId(req: Request): string {
    if (!req.userId) {
        throw AppError.unauthorized("Not authenticated");
    }
    return req.userId;
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = requireUserId(req);
        const user = await userService.findUserById(userId);

        if (!user) {
            throw AppError.notFound("User not found");
        }

        res.json({ user: toPublicUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = requireUserId(req);
        const { name, username } = req.body as UpdateUserInput;

        const user = await userService.updateUser(userId, {
            ...(name !== undefined && { name }),
            ...(username !== undefined && { username }),
        });
        res.json({ user: toPublicUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = requireUserId(req);

        if (!req.file) {
            throw AppError.badRequest("No image file provided");
        }

        const imageUrl = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        const user = await userService.setAvatar(userId, imageUrl);

        res.json({ user: toPublicUser(user) });
    } catch (err) {
        next(err);
    }
}

export async function deleteAccount(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = requireUserId(req);
        await userService.deleteUser(userId);

        clearAuthCookies(res);

        res.json({ message: "Account deleted successfully." });
    } catch (err) {
        next(err);
    }
}
