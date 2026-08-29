import mongoose from "mongoose";
const { Schema } = mongoose;
import type { Document, Model } from "mongoose";

export interface ReportDocument extends Document {
    reporterId: string;
    reportedId: string;
    roomId: string;
    reason: string;
    createdAt: Date;
}

const reportSchema = new Schema<ReportDocument>({
    reporterId: { type: String, required: true, index: true },
    reportedId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const ReportModel: Model<ReportDocument> = mongoose.model<ReportDocument>(
    "Report",
    reportSchema,
);

export interface BlockDocument extends Document {
    blockerId: string;
    blockedId: string;
    createdAt: Date;
}

const blockSchema = new Schema<BlockDocument>({
    blockerId: { type: String, required: true, index: true },
    blockedId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const BlockModel: Model<BlockDocument> = mongoose.model<BlockDocument>("Block", blockSchema);
