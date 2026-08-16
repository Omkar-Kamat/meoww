// configureCloudinary() — sets Cloudinary credentials from env
// uploadImage(filePath: string, options?: object): Promise<UploadResult>
// deleteImage(publicId: string): Promise<void>

// src/config/cloudinary
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { createModuleLogger } from "../utils/logger.js";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

const log = createModuleLogger("cloudinary");

export function configureCloudinary(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required",
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    log.info("Cloudinary configured");
}

export async function uploadImage(
    filePath: string,
    options: UploadApiOptions = {},
): Promise<UploadApiResponse> {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "fried-chicken/profiles",
            transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
            ...options,
        });
        log.info({ publicId: result.public_id }, "Image uploaded");
        return result;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error({ err: error, filePath }, "Image upload failed");
        throw error;
    }
}

export async function deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
        log.info({ publicId }, "Image deleted");
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error({ err: error, publicId }, "Image delete failed");
        throw error;
    }
}

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files allowed"));
            return;
        }
        cb(null, true);
    },
});
