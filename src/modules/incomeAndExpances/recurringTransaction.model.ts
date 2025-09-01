import { Schema, Types, model, Document } from 'mongoose';

export type TRecurringUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface TRecurringTransaction extends Document {
  user_id: Types.ObjectId;
  // The base payload used to create each occurrence. Should NOT include any repeat config.
  basePayload: Record<string, any>;
  // Schedule configuration
  every: number; // interval count, e.g., 1, 5, 10
  unit: TRecurringUnit; // minute | hour | day | week | month
  startAt: Date; // when the schedule was created/started
  nextRunAt: Date; // when the next occurrence should run
  endAt?: Date | null; // optional end date
  maxOccurrences?: number | null; // optional cap on total runs
  runCount: number; // how many times it has run
  isActive: boolean; // active/paused/cancelled flag
  lastRunAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const recurringTransactionSchema = new Schema<TRecurringTransaction>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
    basePayload: { type: Schema.Types.Mixed, required: true },
    every: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['minute', 'hour', 'day', 'week', 'month'], required: true },
    startAt: { type: Date, required: true },
    nextRunAt: { type: Date, required: true },
    endAt: { type: Date, required: false, default: null },
    maxOccurrences: { type: Number, required: false, default: null },
    runCount: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    lastRunAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

export const RecurringTransactionModel = model<TRecurringTransaction>(
  'RecurringTransaction',
  recurringTransactionSchema
);
