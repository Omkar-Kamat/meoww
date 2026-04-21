import { z } from "zod";

/**
 * All fields are optional — this is a PATCH-style update.
 * At least one field must be present (enforced by .refine below).
 * Sending only the fields you want to change is the expected usage.
 */
export const updateProfileSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .min(2, "Name must be at least 2 characters")
                .max(50, "Name must be at most 50 characters")
                .optional(),

            username: z
                .string()
                .min(3, "Username must be at least 3 characters")
                .max(20, "Username must be at most 20 characters")
                .regex(
                    /^[a-z0-9_]+$/,
                    "Username can only contain lowercase letters, numbers and underscores"
                )
                .transform((val) => val.trim().toLowerCase())
                .refine(
                    (val) => !["admin", "meoww", "support", "test"].includes(val),
                    { message: "This username is not allowed" }
                )
                .optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            { message: "At least one field must be provided" }
        ),
});