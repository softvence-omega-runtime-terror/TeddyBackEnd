import mongoose, { Schema } from "mongoose";
import { TUserSubscription } from "./userSubscription.interface";

const userSubscriptionSchema = new Schema<TUserSubscription>({
    user: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
    userProfile: { type: Schema.Types.ObjectId, ref: 'Profile', required: false },
    subscriptionPlan: { type: Schema.Types.ObjectId, ref: 'plan', required: true },

    // Stripe Details
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },// for subscription payments
    stripePaymentIntentId: { type: String }, // for one-time payments
    type: { type: String, enum: ['one_time', 'subscription'], required: true },
    billingInterval: { type: String, enum: ['day', 'week', 'month', 'year', null], default: null },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: 'usd' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'inactive', 'canceled', 'past_due', 'unpaid', 'trialing', 'completed', 'failed', 'pending'], required: true },
});

export const UserSubscriptionModel = mongoose.model<TUserSubscription>('UserSubscription', userSubscriptionSchema);