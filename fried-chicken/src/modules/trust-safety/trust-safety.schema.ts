import { z } from "zod";

export const reportSchema = z.object({
    reportedUserId: z.string().min(1, "reportedUserId is required"),
    roomId: z.string().min(1, "roomId is required"),
    reason: z.string().min(1, "reason is required").max(1000, "Reason is too long"),
});

export const blockSchema = z.object({
    blockedUserId: z.string().min(1, "blockedUserId is required"),
});
