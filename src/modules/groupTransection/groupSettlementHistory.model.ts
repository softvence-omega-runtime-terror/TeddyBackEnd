import mongoose, { Schema } from "mongoose";

export type TGroupSettlementHistory = {
    groupId: number;
    fromEmail: string;
    toEmail: string;
    amount: number;
    settledAt: Date;
    settledBy: mongoose.Types.ObjectId; // User who recorded the settlement
    transactionType: 'individual' | 'multiple'; // Track if it was single or batch settlement
    batchId?: string; // For grouping multiple settlements made together
};

const groupSettlementHistorySchema = new Schema<TGroupSettlementHistory>({
    groupId: { type: Number, required: true, index: true },
    fromEmail: { type: String, required: true },
    toEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    settledAt: { type: Date, required: true, default: Date.now },
    settledBy: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
    transactionType: { type: String, enum: ['individual', 'multiple'], required: true },
    batchId: { type: String }, // UUID for batch settlements
}, { timestamps: true });

// Index for efficient queries
groupSettlementHistorySchema.index({ groupId: 1, settledAt: -1 });
groupSettlementHistorySchema.index({ fromEmail: 1, toEmail: 1 });

export const GroupSettlementHistoryModel = mongoose.model<TGroupSettlementHistory>('GroupSettlementHistory', groupSettlementHistorySchema);