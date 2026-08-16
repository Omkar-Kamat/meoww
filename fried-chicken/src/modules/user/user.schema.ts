// updateProfileSchema — Zod schema

// src/modules/user/user.schema.ts
import { z } from "zod";

export const updateUserSchema = z
    .object({
        name: z.string().min(2).max(50).optional(),
        username: z
            .string()
            .min(3)
            .max(20)
            .regex(
                /^[a-z0-9_]+$/,
                "Username can only contain lowercase letters, numbers and underscores",
            )
            .transform((val) => val.trim().toLowerCase())
            .optional(),
    })
    .refine((data) => data.name !== undefined || data.username !== undefined, {
        message: "At least one field must be provided",
    });
