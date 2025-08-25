import { stripe } from "../../config";
import { PlanModel } from "../plan/plan.model";
import { UserSubscriptionModel } from "./userSubscription.model";


// Assuming PromoCodeModel and paymentService are defined elsewhere
export async function getOrCreateStripeCustomer(user: any) {
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
    });
    return customer.id;
}


// checkout session creation logic
export async function createCheckoutSession(params: {
    user: any,
    planId: string,
    successUrl: string,
    cancelUrl: string,
}) {
    const { user, planId, successUrl, cancelUrl } = params;

    const plan = await PlanModel.findById(planId);
    if (!plan) throw new Error("Plan not found");

    const stripeCustomerId = await getOrCreateStripeCustomer(user);

    // Define session parameters
    const sessionParams: any = {
        customer: stripeCustomerId,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: plan.price * 100, // Price in cents
                    product_data: { name: plan.name },
                    recurring: plan.subscription
                        ? { interval: plan.billingInterval } // Required for subscription
                        : undefined,
                },
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ["card"],
        metadata: {
            userId: user.id,
            planId: plan._id.toString(),
        },
    };

    // If it's a subscription plan, set the session as a subscription
    if (plan.subscription) {
        sessionParams.mode = "subscription"; 
        if (plan.freeTrialDays) {
            sessionParams.subscription_data = { trial_period_days: plan.freeTrialDays };
        }
    } else if (plan.oneTimePayment) {
        sessionParams.mode = "payment"; // For one-time payments
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create a UserSubscription record to save subscription details
    const userSubscription = new UserSubscriptionModel({
        user: user.id,
        planId: plan._id,
        stripeCustomerId,
        price: plan.price,
        type: plan.subscription ? "subscription" : "one_time",
        status: "pending",
        transactionId: session.id, // Session ID as the transaction ID
        startDate: plan.subscription ? new Date() : null, // Set start date if it's a subscription
        endDate: plan.subscription ? null : new Date(), // Set end date if it's a one-time payment
    });

    await userSubscription.save();

    return session;
};

export async function handleStripeWebhook(event: any) {
    try {
        console.log("➡️ Stripe event:", event.type);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as any;
                const stripeCustomerId = session.customer as string;

                let sub = await UserSubscriptionModel.findOne({
                    stripeCustomerId,
                    status: "pending",
                }).sort({ createdAt: -1 });

                if (!sub && session.metadata.userId && session.metadata.planId) {
                    sub = await UserSubscriptionModel.findOne({
                        userId: session.metadata.userId,
                        planId: session.metadata.planId,
                        status: "pending",
                    }).sort({ createdAt: -1 });
                }

                if (!sub) {
                    console.warn("No pending subscription found for session:", session.id);
                    break;
                }

                if (session.subscription) {
                    sub.stripeSubscriptionId = session.subscription;
                }
                sub.status = session.mode === "subscription" ? "active" : "completed"; // Subscription vs One-Time
                sub.startDate = new Date();

                await sub.save();
                break;
            }

            // Handle other cases (invoice.payment_succeeded, etc.) as before
        }

        return { received: true };
    } catch (err: any) {
        console.error("Webhook processing error:", err);
        throw new Error(`Webhook processing error: ${err.message}`);
    }
};


// payment verification logic
export async function verifyPayment(session_id: string) {
    try {
        const session = await Stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return 'Payment not completed'
        }

        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;


        if (!userId || !planId) {
            return 'Invalid session metadata';
        }

        return 'Payment verified successfully';
    } catch (error) {
        console.error('Payment verification failed:', error);
        throw new Error('Payment verification failed');
    }
}


// subscription status update logic
export async function updateSubscriptionStatus(params: {
    userId: string,
    subscriptionId?: string,
    status: string
}) {
    const { userId, subscriptionId, status } = params;

    // Find the subscription to update
    let userSubscription;

    if (subscriptionId) {
        // If subscription ID is provided, find by subscription ID and user ID
        userSubscription = await UserSubscriptionModel.findOne({
            userId,
            stripeSubscriptionId: subscriptionId
        });
    } else {
        // Find the most recent subscription for the user
        userSubscription = await UserSubscriptionModel.findOne({
            userId,
            type: 'subscription'
        }).sort({ createdAt: -1 });
    }

    if (!userSubscription) {
        throw new Error("Subscription not found");
    }

    const currentStatus = userSubscription.status;

    // Handle Stripe subscription updates based on status change
    if (userSubscription.stripeSubscriptionId) {
        try {
            if (status === 'active' && currentStatus !== 'active') {
                // Reactivate subscription in Stripe
                await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
                    cancel_at_period_end: false
                });
            } else if (status === 'inactive' || status === 'cancelled') {
                if (currentStatus === 'active') {
                    // Cancel subscription in Stripe
                    await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
                        cancel_at_period_end: true
                    });
                }
            }
        } catch (stripeError: any) {
            console.error("Stripe update error:", stripeError);
            throw new Error(`Failed to update subscription in Stripe: ${stripeError.message}`);
        }
    }

    // Update subscription status in database
    const previousStatus = userSubscription.status;
    userSubscription.status = status as typeof userSubscription.status;

    // Set end date if marking as inactive/cancelled
    if (status === 'inactive' || status === 'cancelled') {
        userSubscription.endDate = new Date();
    } else if (status === 'active' && (previousStatus === 'inactive' || previousStatus === 'canceled')) {
        // Clear end date if reactivating
        userSubscription.endDate = null;
    }

    await userSubscription.save();

    return {
        subscriptionId: userSubscription._id,
        previousStatus,
        currentStatus: status,
        updatedAt: new Date(),
        subscription: {
            id: userSubscription._id,
            userId: userSubscription.userId,
            planId: userSubscription.planId,
            status: userSubscription.status,
            startDate: userSubscription.startDate,
            endDate: userSubscription.endDate,
            type: userSubscription.type
        }
    };
}


const userSubscriptionService = {
    createCheckoutSession,
    handleStripeWebhook,
    verifyPayment,
    updateSubscriptionStatus,
};

export default userSubscriptionService;
