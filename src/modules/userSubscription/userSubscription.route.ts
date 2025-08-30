import express from 'express';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';
import userSubscriptionController from './userSubscription.controller';

const userSubscriptionRoutes = express.Router();


// update subscription status
userSubscriptionRoutes.patch('/update-subscription-status', auth([userRole.admin, userRole.user]), userSubscriptionController.updateSubscriptionStatus);

userSubscriptionRoutes.get('/get-subscription/:userId', auth([userRole.admin, userRole.user]), userSubscriptionController.getUserById);

userSubscriptionRoutes.get('/get-total-subscriber', auth([userRole.admin, userRole.user]), userSubscriptionController.getTotalSubscribers);

userSubscriptionRoutes.get('/active-subscriber', auth([userRole.admin, userRole.user]), userSubscriptionController.getActiveSubscribers);


export default userSubscriptionRoutes;