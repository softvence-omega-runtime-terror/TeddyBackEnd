import { Schema } from "mongoose";

export type TPlan = {
    name: string;
    price: number;
    stripePriceId?: string;
    services: Schema.Types.ObjectId[];
    freeTrialDays?: number;
    subscription?: boolean;
    billingInterval?: "week" | "month" | "year";
    oneTimePayment?: boolean;
    description?: string;
}