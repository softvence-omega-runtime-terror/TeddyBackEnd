import mongoose from "mongoose";


export type TUserSubscription = {
    user: mongoose.Types.ObjectId;
    userProfile?: mongoose.Types.ObjectId;
    subscriptionPlan: mongoose.Types.ObjectId;

    // Stripe Details
    stripeCustomerId?: string;
    stripeSubscriptionId?: string; // for recurring payments
    stripePaymentIntentId?: string; // for one-time payments
    transactionId?: string; // Session ID or payment intent ID
    type: 'one_time' | 'subscription';
    billingInterval?: 'day' | 'week' | 'month' | 'year' | null;
    
    // Pricing and Discount Information
    price: number; // Final price after discount
    originalPrice?: number; // Original price before discount
    discountAmount?: number; // Amount discounted
    discountType?: 'percentage' | 'fixed'; // Type of discount applied
    discountValue?: number; // Value of discount (percentage or fixed amount)
    currency: string;
    
    startDate?: Date;
    endDate?: Date | null;
    status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'completed' | 'failed' | 'pending';
};