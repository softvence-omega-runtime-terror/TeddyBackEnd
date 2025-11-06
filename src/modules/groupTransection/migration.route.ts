/**
 * Migration Routes
 * 
 * Add these routes to your main groupTransection.route.ts file
 * or use this as a separate router
 */

import express from 'express';
import { userRole } from '../../constants';
import auth from '../../middleware/auth';
import migrationController from './migration.controller';

const migrationRouter = express.Router();

// IMPORTANT: Protect this route - only admins should run migrations
migrationRouter.post(
    '/migrate/settlements', 
    auth([userRole.admin]), // Change to appropriate role
    migrationController.runSettlementMigration
);

export default migrationRouter;

/**
 * HOW TO USE:
 * 
 * 1. In your main routes file, import and add:
 *    import migrationRouter from './modules/groupTransection/migration.route';
 *    app.use('/groupTransaction', migrationRouter);
 * 
 * 2. After deploying, call once:
 *    POST /groupTransaction/migrate/settlements
 *    Headers: { Authorization: "Bearer <admin-token>" }
 * 
 * 3. Check the response to see how many groups were processed
 * 
 * 4. OPTIONAL: Remove these routes after migration is complete
 */
