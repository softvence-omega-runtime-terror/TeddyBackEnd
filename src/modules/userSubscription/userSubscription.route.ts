import express from 'express';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';
import userSubscriptionController from './userSubscription.controller';

const userSubscriptionRoutes = express.Router();


// checkout session
userSubscriptionRoutes.post('/create-checkout-session', auth([userRole.admin, userRole.user]), userSubscriptionController.createCheckout);

// verify payment
userSubscriptionRoutes.post('/verify-payment', auth([userRole.admin, userRole.user]), userSubscriptionController.verifyPayment);

// update subscription status
userSubscriptionRoutes.patch('/update-subscription-status', auth([userRole.admin, userRole.user]), userSubscriptionController.updateSubscriptionStatus);


export default userSubscriptionRoutes;