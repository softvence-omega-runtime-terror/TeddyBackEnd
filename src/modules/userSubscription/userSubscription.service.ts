import { stripe } from "../../config";
import idConverter from "../../util/idConverter";
import { UserSubscriptionModel } from "./userSubscription.model";


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
            user: userId,
            stripeSubscriptionId: subscriptionId
        });
    } else {
        // Find the most recent subscription for the user
        userSubscription = await UserSubscriptionModel.findOne({
            user: userId,
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
            userId: userSubscription.user,
            planId: userSubscription.subscriptionPlan,
            status: userSubscription.status,
            startDate: userSubscription.startDate,
            endDate: userSubscription.endDate,
            type: userSubscription.type
        }
    };
}

const getUserById = async (userId: string) => {
    const id = idConverter(userId);
    const result = await UserSubscriptionModel.find({ user: id }).populate('user subscriptionPlan');
    if (!result || result.length === 0) {
        throw new Error("Subscription not found");
    }
    return result;
};

const getTotalSubscribers = async () => {
    try {
        const result = await UserSubscriptionModel.find({ type: 'subscription' }).countDocuments();
        return result;
    } catch (error) {
        console.error("Error fetching total subscribers:", error);
        throw new Error("Error fetching total subscribers");
    }
};

const getActiveSubscribers = async () => {
    try {
        const result = await UserSubscriptionModel.find({ type: 'subscription', status: 'active' }).countDocuments();
        return result;
    } catch (error) {
        console.error("Error fetching active subscribers:", error);
        throw new Error("Error fetching active subscribers");
    }
};

const userSubscriptionService = {
    getUserById,
    getTotalSubscribers,
    getActiveSubscribers,
    updateSubscriptionStatus
};

export default userSubscriptionService;
