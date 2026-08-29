import { uploadImageStream } from "../config/cloudinary.js";

export async function uploadBufferToCloudinary(
    buffer: Buffer,
    _originalName: string,
): Promise<string> {
    const result = await uploadImageStream(buffer);
    return result.secure_url;
}
