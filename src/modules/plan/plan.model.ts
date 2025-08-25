import mongoose, { Schema } from "mongoose";
import { TPlan } from "./plan.interface";

const planSchema = new Schema<TPlan>({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    stripePriceId: { type: String, unique: true, required: true },
    services: { type: [Schema.Types.ObjectId], ref: "services", required: true },
    freeTrialDays: { type: Number, default: 0 },
    subscription: { type: Boolean, default: false },
    oneTimePayment: { type: Boolean, default: false },
    billingInterval: {
        type: String,
        enum: ["week", "month", "year"],
        default: "month",
    },
    description: { type: String, default: "" },
}, { timestamps: true });

export const PlanModel = mongoose.model<TPlan>("Plan", planSchema);