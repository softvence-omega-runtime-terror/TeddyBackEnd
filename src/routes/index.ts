import express from 'express';
import authRouter from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import messageRouter from '../modules/message/message.routes';
import incomeAndExpenseRouter from '../modules/incomeAndExpances/incomeAndexpence.route';
import reportRoutes from '../modules/report/report.route';
import historyRoutes from '../modules/history/history.route';
import { transectionRoutes } from '../modules/transection/transection.route';
import planRoutes from '../modules/plan/plan.routes';
import userSubscriptionRoutes from '../modules/userSubscription/userSubscription.route';
import paymentRoutes from '../modules/payment/payment.route';
import groupTransactionRouter from '../modules/groupTransection/groupTransection.route';


const Routes = express.Router();
// Array of module routes
const moduleRouts = [
  {
    path: '/auth',
    router: authRouter,
  },
  {
    path: '/users',
    router: userRoutes,
  },
  {
    path: '/message',
    router: messageRouter,
  },
  {
    path: '/incomeAndExpences',
    router: incomeAndExpenseRouter,
  },
  {
    path: '/groupTransaction',
    router: groupTransactionRouter,
  },
  {
    path: '/report',
    router: reportRoutes,
  },
  {
    path: '/history',
    router: historyRoutes,
  }
  ,
  {
    path: '/transection',
    router: transectionRoutes,
  },
  {
    path: '/',
    router: planRoutes,
  },
  {
    path: '/payment',
    router: paymentRoutes,
  },
  {
    path: '/subscription',
    router: userSubscriptionRoutes,
  }
];

moduleRouts.forEach(({ path, router }) => {
  Routes.use(path, router);
});

export default Routes;
