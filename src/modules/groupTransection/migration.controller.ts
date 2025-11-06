/**
 * Migration Controller
 * Provides endpoints to run database migrations safely
 */

import { Request, Response } from 'express';
import catchAsync from '../../util/catchAsync';
import { migrateSettlements } from './migration-cleanup-settlements';

/**
 * POST /groupTransaction/migrate/settlements
 * Run the settlement cleanup migration
 * 
 * WARNING: This should only be run ONCE after deploying the new schema
 */
const runSettlementMigration = catchAsync(async (req: Request, res: Response) => {
    // Optional: Add admin-only check here
    // if (req.user?.role !== 'admin') {
    //     return res.status(403).json({
    //         status: 'fail',
    //         message: 'Only administrators can run migrations'
    //     });
    // }

    console.log('Starting settlement migration via API...');
    
    const result = await migrateSettlements();
    
    res.status(200).json({
        status: 'success',
        message: 'Settlement migration completed successfully',
        data: {
            groupsProcessed: result.groupsProcessed,
            settlementsMoved: result.settlementsMoved,
            timestamp: new Date().toISOString()
        }
    });
});

const migrationController = {
    runSettlementMigration
};

export default migrationController;
