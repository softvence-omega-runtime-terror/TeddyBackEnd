import express from 'express';
import authRouter from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import incomeAndExpenseRouter from '../modules/incomeAndExpances/incomeAndexpence.route';
import reportRoutes from '../modules/report/report.route';
import historyRoutes from '../modules/history/history.route';
import { transectionRoutes } from '../modules/transection/transection.route';
import planRoutes from '../modules/plan/plan.routes';
import userSubscriptionRoutes from '../modules/userSubscription/userSubscription.route';
import paymentRoutes from '../modules/payment/payment.route';
import groupTransactionRouter from '../modules/groupTransection/groupTransection.route';
import testRouter from '../modules/test/test.routes';
import translateTestRouter from './test';

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Users
 *     description: User management and profile operations
 *   - name: Group Transactions
 *     description: Group expense management and financial tracking
 *   - name: Income & Expenses
 *     description: Personal income and expense tracking
 *   - name: Reports
 *     description: Financial reports and analytics
 *   - name: Messages
 *     description: User messaging system
 *   - name: Plans
 *     description: Subscription plans management
 *   - name: Payments
 *     description: Payment processing and transactions
 *   - name: Testing
 *     description: API testing endpoints for development
 * 
 * info:
 *   description: |
 *     # TeddyBackEnd API Documentation
 *     
 *     Welcome to the TeddyBackEnd API! This is a comprehensive expense tracking and group financial management system.
 *     
 *     ## Key Features:
 *     - **Multi-language Support**: API responses automatically translated to user's preferred language
 *     - **Multi-currency Support**: Financial amounts converted to user's preferred currency with real-time exchange rates
 *     - **Group Expense Management**: Create groups, split expenses, track balances
 *     - **Personal Finance Tracking**: Income/expense management with analytics
 *     - **Real-time Notifications**: Stay updated with group activities
 *     
 *     ## Supported Languages:
 *     - English (en)
 *     - Bahasa Indonesia (id)
 *     - Bahasa Melayu (ms)
 *     - Korean (ko)
 *     - Chinese (zh)
 *     - Japanese (ja)
 *     
 *     ## Supported Currencies:
 *     - USD (US Dollar)
 *     - EUR (Euro)
 *     - SGD (Singapore Dollar)
 *     - GBP (British Pound)
 *     - AUD (Australian Dollar)
 *     
 *     ## Authentication:
 *     Most endpoints require JWT authentication. Include the token in the Authorization header:
 *     `Authorization: Bearer <your-jwt-token>`
 *     
 *     ## Currency & Language Preferences:
 *     Set your preferred currency and language in your user profile. All API responses will be:
 *     - Translated to your preferred language
 *     - Financial amounts converted to your preferred currency
 *     - Include currency conversion notes when applicable
 */

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
  },
  {
    path: '/test',
    router: testRouter,
  },
  {
    path: '/translate-test',
    router: translateTestRouter,
  },
  {
    path: '/translate-test',
    router: translateTestRouter,
  }
];

moduleRouts.forEach(({ path, router }) => {
  Routes.use(path, router);
});

export default Routes;
