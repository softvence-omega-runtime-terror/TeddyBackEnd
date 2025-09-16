import { Schema } from "mongoose";

export type TPlan = {
    name: string;
    aiAssistent: boolean;
    aiChatBot: boolean;
    aiChatCountLimit: number | 100;
    smartBudgeting: boolean;
    splitBills: number | 3;
    price: number;
    stripePriceId?: string;
    services: Schema.Types.ObjectId[];
    freeTrialDays?: number;
    subscription?: boolean;
    billingInterval?: "free" | "month" | "year";
    oneTimePayment?: boolean;
    description?: string;
}