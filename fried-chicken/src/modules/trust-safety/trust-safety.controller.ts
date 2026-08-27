import type { Request, Response, NextFunction } from "express";
import { ReportModel, BlockModel } from "./trust-safety.model.js";
import { AppError } from "../../utils/AppError.js";
import { getRoom } from "../matchmaking/matchmaking.store.js";

function requireUserId(req: Request): string {
    if (!req.userId) {
        throw AppError.unauthorized("Not authenticated");
    }
    return req.userId;
}

export async function reportUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { reportedUserId, roomId, reason } = req.body as { reportedUserId: string; roomId: string; reason: string };
        const reporterId = requireUserId(req);

        if (reporterId === reportedUserId) {
            throw AppError.badRequest("Cannot report yourself", "INVALID_REPORT");
        }

        // Best-effort authenticity check: if the room record still exists in
        // Redis (it's cleared shortly after either party leaves/disconnects),
        // require that the reporter and the reported user were actually the
        // two participants. This blocks the easy case of filing reports
        // against arbitrary userId/roomId pairs the client never took part
        // in. It is not a complete guarantee — rooms are ephemeral and may
        // already be gone by the time a report is filed — so this should be
        // paired with human moderation review rather than auto-actioning
        // reports. Tracked as a follow-up: persist a durable call-history
        // record so every report can be verified, not just ones filed while
        // the room is still live.
        const room = await getRoom(roomId);
        if (room) {
            const participants = new Set([room.user1, room.user2]);
            if (!participants.has(reporterId) || !participants.has(reportedUserId)) {
                throw AppError.badRequest(
                    "Reported user was not part of that room",
                    "INVALID_REPORT",
                );
            }
        }

        await ReportModel.create({
            reporterId,
            reportedId: reportedUserId,
            roomId,
            reason,
        });

        res.status(201).json({ status: "success", message: "Report submitted" });
    } catch (err) {
        next(err);
    }
}

export async function blockUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { blockedUserId } = req.body as { blockedUserId: string };
        const blockerId = requireUserId(req);

        if (blockerId === blockedUserId) {
            throw AppError.badRequest("Cannot block yourself", "INVALID_BLOCK");
        }

        try {
            await BlockModel.create({
                blockerId,
                blockedId: blockedUserId,
            });
        } catch (e) {
            const err = e as { code?: number };
            if (err.code !== 11000) throw e; // Ignore duplicate blocks
        }

        res.status(201).json({ status: "success", message: "User blocked" });
    } catch (err) {
        next(err);
    }
}
