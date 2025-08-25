import express from 'express';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';
import paymentController from './payment.controller';

const paymentRoutes = express.Router();


// checkout session
paymentRoutes.post('/create-checkout-session', auth([userRole.admin, userRole.user]), paymentController.createCheckout);

// verify payment
paymentRoutes.post('/verify-payment', auth([userRole.admin, userRole.user]), paymentController.verifyPayment);

// update subscription status
paymentRoutes.patch('/update-subscription-status', auth([userRole.admin, userRole.user]), paymentController.updateSubscriptionStatus);


export default paymentRoutes;