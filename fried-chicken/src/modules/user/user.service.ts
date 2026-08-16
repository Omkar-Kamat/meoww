// findUserById(id: string): Promise<UserDocument | null>
// updateUser(id: string, data: UpdateUserInput): Promise<UserDocument>
// setAvatar(id: string, imageUrl: string): Promise<UserDocument>
// deleteUser(id: string): Promise<void>

// src/modules/user/user.service.ts
import UserModel, { type UserDocument } from "./user.model.js";
import { AppError } from "../../utils/AppError.js";
import type { UpdateUserInput } from "./user.types.js";
import { isDuplicateKeyError } from "../../utils/mongoErrors.js";

export async function findUserById(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findById(id);
    return user;
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<UserDocument> {
    if (data.username) {
        const existing = await UserModel.findOne({ username: data.username });
        if (existing && existing._id.toString() !== id) {
            throw AppError.conflict("Username already taken", "USERNAME_TAKEN");
        }
    }

    const updates: UpdateUserInput = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.username !== undefined) updates.username = data.username;

    try {
        const user = await UserModel.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            },
        );

        if (!user) {
            throw AppError.notFound("User not found");
        }

        return user;
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            const field = Object.keys(err.keyPattern ?? {})[0];
            if (field === "username")
                throw AppError.conflict("Username already taken", "USERNAME_TAKEN");
            throw AppError.conflict("Duplicate key error", "DUPLICATE_ERROR");
        }
        throw err;
    }
}

export async function setAvatar(id: string, imageUrl: string): Promise<UserDocument> {
    const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: { profileImage: imageUrl } },
        { new: true, runValidators: true },
    );

    if (!user) {
        throw AppError.notFound("User not found");
    }

    return user;
}

export async function deleteUser(id: string): Promise<void> {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
        throw AppError.notFound("User not found");
    }
}
