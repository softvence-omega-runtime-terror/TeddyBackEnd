/**
 * MIGRATION SCRIPT: Clean up settlement expenses and convert to proper settlements
 * 
 * This script:
 * 1. Finds all group transactions with settlement-like expenses (isSettledItem: true or notes containing "Settlement:")
 * 2. Moves them from groupExpenses to the new settlements array
 * 3. Preserves the settlement history
 * 
 * Run this once after deploying the new schema
 */

import mongoose from 'mongoose';
import { GroupTransactionModel } from './groupTransection.model';

export async function migrateSettlements() {
    console.log('Starting settlement migration...');
    
    try {
        // Find all groups
        const groups = await GroupTransactionModel.find({});
        
        let totalGroupsProcessed = 0;
        let totalSettlementsMoved = 0;
        
        for (const group of groups) {
            if (!group.groupExpenses || group.groupExpenses.length === 0) {
                continue;
            }
            
            // Initialize settlements array if it doesn't exist
            if (!group.settlements) {
                group.settlements = [];
            }
            
            const settlementExpenses: any[] = [];
            const realExpenses: any[] = [];
            
            // Separate settlement expenses from real expenses
            for (const expense of group.groupExpenses) {
                const expenseAny = expense as any;
                
                // Check if this is a settlement expense
                const isSettlement = 
                    expenseAny.isSettledItem === true || 
                    (expense.note && expense.note.toLowerCase().includes('settlement:'));
                
                if (isSettlement) {
                    settlementExpenses.push(expense);
                    
                    // Convert expense to settlement format
                    // Settlement expenses have structure: fromEmail pays, toEmail receives
                    let fromEmail = '';
                    let toEmail = '';
                    let amount = expense.totalExpenseAmount;
                    
                    // Extract fromEmail (who paid)
                    if (expense.paidBy.type === 'individual') {
                        fromEmail = expense.paidBy.memberEmail;
                    }
                    
                    // Extract toEmail (who receives)
                    if (expense.shareWith.type === 'custom' && expense.shareWith.shares && expense.shareWith.shares.length > 0) {
                        toEmail = expense.shareWith.shares[0].memberEmail;
                    }
                    
                    if (fromEmail && toEmail && amount > 0) {
                        // Add to settlements array
                        group.settlements.push({
                            settlementDate: expense.expenseDate || new Date(),
                            fromEmail: fromEmail,
                            toEmail: toEmail,
                            amount: amount,
                            currency: expense.currency,
                            settledBy: group.ownerId || new mongoose.Types.ObjectId(),
                            note: expense.note || 'Migrated settlement'
                        } as any);
                        
                        totalSettlementsMoved++;
                    }
                } else {
                    realExpenses.push(expense);
                }
            }
            
            if (settlementExpenses.length > 0) {
                // Replace groupExpenses with only real expenses
                group.groupExpenses = realExpenses as any;
                await group.save();
                totalGroupsProcessed++;
                
                console.log(`Group ${group.groupId}: Moved ${settlementExpenses.length} settlement(s) to settlements array`);
            }
        }
        
        console.log('\n=== Migration Complete ===');
        console.log(`Total groups processed: ${totalGroupsProcessed}`);
        console.log(`Total settlements moved: ${totalSettlementsMoved}`);
        console.log('==========================\n');
        
        return {
            success: true,
            groupsProcessed: totalGroupsProcessed,
            settlementsMoved: totalSettlementsMoved
        };
        
    } catch (error: any) {
        console.error('Error during migration:', error);
        throw error;
    }
}

// Uncomment to run directly
// migrateSettlements()
//     .then(() => {
//         console.log('Migration successful');
//         process.exit(0);
//     })
//     .catch(error => {
//         console.error('Migration failed:', error);
//         process.exit(1);
//     });
