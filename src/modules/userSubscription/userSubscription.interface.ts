import mongoose from "mongoose";


export type TUserSubscription = {
    user: mongoose.Types.ObjectId;
    userProfile?: mongoose.Types.ObjectId;
    subscriptionPlan: mongoose.Types.ObjectId;

    // Stripe Details
    stripeCustomerId?: string;
    stripeSubscriptionId?: string; // for recurring payments
    stripePaymentIntentId?: string; // for one-time payments
    type: 'one_time' | 'subscription';
    billingInterval?: 'day' | 'week' | 'month' | 'year' | null;
    price: number;
    currency: string;
    startDate?: Date;
    endDate?: Date | null;
    status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'completed' | 'failed' | 'pending';
};