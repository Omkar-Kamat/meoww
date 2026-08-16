// src/utils/uploadHelper.ts
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { uploadImage } from "../config/cloudinary.js";

export async function uploadBufferToCloudinary(
    buffer: Buffer,
    originalName: string,
): Promise<string> {
    const tempPath = join(tmpdir(), `${randomUUID()}-${originalName}`);
    try {
        await writeFile(tempPath, buffer);
        const result = await uploadImage(tempPath);
        return result.secure_url;
    } finally {
        await unlink(tempPath).catch(() => undefined);
    }
}
