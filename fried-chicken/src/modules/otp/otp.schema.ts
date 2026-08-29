import { z } from "zod";

export const otpRequestSchema = z.object({
    identifier: z.email("Please provide a valid email address"),
});

export const otpVerifySchema = z.object({
    identifier: z.email(),
    code: z.string().length(6),
});
