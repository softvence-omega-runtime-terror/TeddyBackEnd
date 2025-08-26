import { Request, Response } from "express";
import catchAsync from "../../util/catchAsync";
import userSubscriptionService from "./userSubscription.service";


// Update Subscription Status
const updateSubscriptionStatus = catchAsync(async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { subscriptionId, status } = req.body;

        // Validate status
        const validStatuses = ['active', 'inactive', 'cancelled', 'pending', 'trialing'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
            });
        }

        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Missing or invalid userId'
            });
        }

        const result = await userSubscriptionService.updateSubscriptionStatus({
            userId,
            subscriptionId,
            status
        });

        res.status(200).json({
            success: true,
            message: 'Subscription status updated successfully',
            data: result
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update subscription status'
        });
    }
});

const getUserById = catchAsync(async (req, res) => {
    const { userId } = req.params;

    const result = await userSubscriptionService.getUserById(userId);
    res.status(200).json({
        success: true,
        message: "Subscription retrieved successfully",
        data: {
            subscription: result
        }
    });
});

const getTotalSubscribers = catchAsync(async (req, res) => {
    const result = await userSubscriptionService.getTotalSubscribers();
    res.status(200).json({
        success: true,
        message: "Subscription retrieved successfully",
        data: {
            subscription: result
        }
    });
});

const getActiveSubscribers = catchAsync(async (req, res) => {
    const result = await userSubscriptionService.getActiveSubscribers();
    res.status(200).json({
        success: true,
        message: "Active subscribers retrieved successfully",
        data: {
            subscription: result
        }
    });
});

const userSubscriptionController = {
    updateSubscriptionStatus,
    getUserById,
    getTotalSubscribers,
    getActiveSubscribers
};

export default userSubscriptionController;