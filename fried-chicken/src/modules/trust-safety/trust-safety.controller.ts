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
        const { reportedUserId, roomId, reason } = req.body as {
            reportedUserId: string;
            roomId: string;
            reason: string;
        };
        const reporterId = requireUserId(req);

        if (reporterId === reportedUserId) {
            throw AppError.badRequest("Cannot report yourself", "INVALID_REPORT");
        }

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
            if (err.code !== 11000) throw e;
        }

        res.status(201).json({ status: "success", message: "User blocked" });
    } catch (err) {
        next(err);
    }
}
