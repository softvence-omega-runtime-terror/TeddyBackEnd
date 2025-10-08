import { stripe } from "../../config";
import { PlanModel } from "../plan/plan.model";
import { UserSubscriptionModel } from "../userSubscription/userSubscription.model";


// Assuming PromoCodeModel and paymentService are defined elsewhere
export async function getOrCreateStripeCustomer(user: any) {
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
    });
    return customer.id;
}


// Discount calculation helper function
function calculateDiscountedPrice(originalPrice: number, discountType?: string, discountValue?: number) {
    if (!discountType || !discountValue || discountValue <= 0) {
        return {
            originalPrice,
            discountAmount: 0,
            finalPrice: originalPrice
        };
    }

    let discountAmount = 0;
    let finalPrice = originalPrice;

    if (discountType === "percentage") {
        // Ensure percentage is between 0 and 100
        const percentageDiscount = Math.min(Math.max(discountValue, 0), 100);
        discountAmount = (originalPrice * percentageDiscount) / 100;
        finalPrice = originalPrice - discountAmount;
    } else if (discountType === "fixed") {
        // Ensure fixed discount doesn't exceed original price
        discountAmount = Math.min(discountValue, originalPrice);
        finalPrice = originalPrice - discountAmount;
    }

    // Ensure final price is not negative
    finalPrice = Math.max(finalPrice, 0);
    
    return {
        originalPrice,
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        finalPrice: Math.round(finalPrice * 100) / 100
    };
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

    // Calculate discounted price
    const priceCalculation = calculateDiscountedPrice(
        plan.price,
        plan.discountType,
        plan.discountValue
    );

    // Define session parameters
    const sessionParams: any = {
        customer: stripeCustomerId,
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: Math.round(priceCalculation.finalPrice * 100), // Discounted price in cents
                    product_data: { 
                        name: plan.name,
                        description: priceCalculation.discountAmount > 0 
                            ? `Original: $${priceCalculation.originalPrice}, Discount: $${priceCalculation.discountAmount}` 
                            : undefined
                    },
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
            originalPrice: priceCalculation.originalPrice.toString(),
            discountAmount: priceCalculation.discountAmount.toString(),
            finalPrice: priceCalculation.finalPrice.toString(),
            discountType: plan.discountType || "",
            discountValue: plan.discountValue?.toString() || "0",
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
        subscriptionPlan: plan._id,
        stripeCustomerId,
        price: priceCalculation.finalPrice, // Use discounted price
        originalPrice: priceCalculation.originalPrice,
        discountAmount: priceCalculation.discountAmount,
        discountType: plan.discountType,
        discountValue: plan.discountValue,
        type: plan.subscription ? "subscription" : "one_time",
        status: "pending",
        transactionId: session.id, // Session ID as the transaction ID
        billingInterval: plan.subscription ? plan.billingInterval : null,
        startDate: plan.subscription ? new Date() : null, // Set start date if it's a subscription
        endDate: plan.subscription ? null : plan?.billingInterval === 'year'
            ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            : plan?.billingInterval === 'month'
            ? new Date(new Date().setMonth(new Date().getMonth() + 1))
            : null,
        currency: "USD",
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
                console.log("Processing checkout.session.completed for session:", session.id);
                
                // First try to find by session/transaction ID (most reliable)
                let sub = await UserSubscriptionModel.findOne({
                    transactionId: session.id,
                    status: "pending",
                }).sort({ createdAt: -1 });

                // Fallback: try to find by stripe customer ID
                if (!sub && session.customer) {
                    sub = await UserSubscriptionModel.findOne({
                        stripeCustomerId: session.customer,
                        status: "pending",
                    }).sort({ createdAt: -1 });
                }

                // Fallback: try to find by metadata
                if (!sub && session.metadata?.userId && session.metadata?.planId) {
                    sub = await UserSubscriptionModel.findOne({
                        user: session.metadata.userId,
                        subscriptionPlan: session.metadata.planId,
                        status: "pending",
                    }).sort({ createdAt: -1 });
                }

                if (!sub) {
                    console.warn("No pending subscription found for session:", session.id);
                    break;
                }

                console.log("Found subscription to update:", sub._id);

                // Update subscription details based on payment success
                if (session.subscription) {
                    sub.stripeSubscriptionId = session.subscription;
                }
                
                if (session.payment_intent) {
                    sub.stripePaymentIntentId = session.payment_intent;
                }

                // Set status based on payment mode and payment status
                if (session.payment_status === 'paid') {
                    if (session.mode === 'subscription') {
                        sub.status = 'active';
                        sub.startDate = new Date();
                        // For subscriptions, endDate should be null (ongoing)
                        sub.endDate = null;
                    } else if (session.mode === 'payment') {
                        sub.status = 'completed';
                        sub.startDate = new Date();
                        // For one-time payments, set endDate to current date
                        sub.endDate = new Date();
                    }
                } else {
                    console.warn("Payment not completed for session:", session.id);
                    sub.status = 'failed';
                }

                await sub.save();
                console.log("✅ Subscription updated successfully:", sub._id, "Status:", sub.status);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as any;
                console.log("Processing invoice.payment_succeeded for subscription:", invoice.subscription);
                
                if (invoice.subscription) {
                    const sub = await UserSubscriptionModel.findOne({
                        stripeSubscriptionId: invoice.subscription,
                    });

                    if (sub && sub.status !== 'active') {
                        sub.status = 'active';
                        sub.startDate = new Date(invoice.period_start * 1000);
                        sub.endDate = new Date(invoice.period_end * 1000);
                        await sub.save();
                        console.log("✅ Subscription activated via invoice:", sub._id);
                    }
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as any;
                console.log("Processing invoice.payment_failed for subscription:", invoice.subscription);
                
                if (invoice.subscription) {
                    const sub = await UserSubscriptionModel.findOne({
                        stripeSubscriptionId: invoice.subscription,
                    });

                    if (sub) {
                        sub.status = 'past_due';
                        await sub.save();
                        console.log("❌ Subscription marked as past_due:", sub._id);
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as any;
                console.log("Processing customer.subscription.deleted for subscription:", subscription.id);
                
                const sub = await UserSubscriptionModel.findOne({
                    stripeSubscriptionId: subscription.id,
                });

                if (sub) {
                    sub.status = 'canceled';
                    sub.endDate = new Date();
                    await sub.save();
                    console.log("🚫 Subscription canceled:", sub._id);
                }
                break;
            }

            default:
                console.log("Unhandled event type:", event.type);
        }

        return { received: true };
    } catch (err: any) {
        console.error("❌ Webhook processing error:", err);
        throw new Error(`Webhook processing error: ${err.message}`);
    }
};


// payment verification logic
export async function verifyPayment(session_id: string) {
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return { 
                success: false, 
                message: 'Payment not completed',
                status: session.payment_status 
            };
        }

        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
            return { 
                success: false, 
                message: 'Invalid session metadata' 
            };
        }

        // Find the corresponding subscription record
        const subscription = await UserSubscriptionModel.findOne({
            transactionId: session_id,
            user: userId,
            subscriptionPlan: planId,
        }).populate('subscriptionPlan');

        if (!subscription) {
            return { 
                success: false, 
                message: 'Subscription record not found' 
            };
        }

        return { 
            success: true, 
            message: 'Payment verified successfully',
            data: {
                sessionId: session_id,
                paymentStatus: session.payment_status,
                subscriptionStatus: subscription.status,
                originalPrice: subscription.originalPrice,
                discountAmount: subscription.discountAmount,
                finalPrice: subscription.price,
                discountType: subscription.discountType,
                discountValue: subscription.discountValue,
                plan: subscription.subscriptionPlan,
                type: subscription.type,
                currency: subscription.currency,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
            }
        };
    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return { 
            success: false, 
            message: error.message || 'Payment verification failed' 
        };
    }
}



const paymentServices = {
    createCheckoutSession,
    handleStripeWebhook,
    verifyPayment,
};

export default paymentServices;
