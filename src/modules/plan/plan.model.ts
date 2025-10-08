import mongoose, { Schema } from "mongoose";
import { TPlan } from "./plan.interface";

const planSchema = new Schema<TPlan>({
    name: { type: String, required: true, unique: true },
    aiAssistent: { type: Boolean, default: false },
    aiChatBot: { type: Boolean, default: false },
    aiChatCountLimit: { type: Number, default: 100 },
    smartBudgeting: { type: Boolean, default: false },
    splitBills: { type: Number, default: 3 },
    price: { type: Number, required: true },
    stripePriceId: { type: String, unique: true, required: true },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "fixed" },
    discountValue: { type: Number, default: 0 },
    services: { type: [Schema.Types.ObjectId], ref: "services", required: true },
    freeTrialDays: { type: Number, default: 0 },
    subscription: { type: Boolean, default: false },
    oneTimePayment: { type: Boolean, default: false },
    billingInterval: {
        type: String,
        enum: ["free", "month", "year"],
        default: "free",
    },
    description: { type: String, default: "" },
}, { timestamps: true });

export const PlanModel = mongoose.model<TPlan>("Plan", planSchema);