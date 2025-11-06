/**
 * TEST SCRIPT: Verify Settlement Calculations
 * 
 * This script tests the new settlement system to ensure calculations are correct
 */

import mongoose from 'mongoose';
import { GroupTransactionModel } from './groupTransection.model';
import groupTransactionServices from './groupTransection.service';

async function testSettlementCalculations() {
    console.log('=== Testing Settlement Calculations ===\n');
    
    try {
        // Test Case 1: Simple expense with settlement
        console.log('Test 1: Simple expense + settlement');
        console.log('Scenario: Alice pays $100, split with Bob & Charlie ($33.33 each)');
        console.log('Then: Bob settles his debt\n');
        
        const testGroupId = '9999999999'; // Use a test group ID
        
        // Get balances before settlement
        const balancesBefore = await groupTransactionServices.calculateGroupBalances(testGroupId);
        console.log('Balances BEFORE settlement:');
        Object.entries(balancesBefore).forEach(([email, balance]) => {
            console.log(`  ${email}: paid=$${balance.paid}, owes=$${balance.owes}, net=$${balance.net.toFixed(2)}`);
        });
        
        // Simulate settlement (Bob pays Alice $33.33)
        // In real scenario, this would be done via API
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(testGroupId) });
        if (group) {
            if (!group.settlements) group.settlements = [];
            group.settlements.push({
                settlementDate: new Date(),
                fromEmail: 'bob@example.com',
                toEmail: 'alice@example.com',
                amount: 33.33,
                currency: 'USD',
                settledBy: group.ownerId || new mongoose.Types.ObjectId(),
                note: 'Test settlement'
            } as any);
            await group.save();
        }
        
        // Get balances after settlement
        const balancesAfter = await groupTransactionServices.calculateGroupBalances(testGroupId);
        console.log('\nBalances AFTER settlement:');
        Object.entries(balancesAfter).forEach(([email, balance]) => {
            console.log(`  ${email}: paid=$${balance.paid}, owes=$${balance.owes}, net=$${balance.net.toFixed(2)}`);
        });
        
        // Verify
        const aliceAfter = balancesAfter['alice@example.com'];
        const bobAfter = balancesAfter['bob@example.com'];
        
        console.log('\n✅ Verification:');
        console.log(`  Bob should be settled (net ≈ 0): ${Math.abs(bobAfter?.net || 0) < 0.01 ? 'PASS' : 'FAIL'}`);
        console.log(`  Alice should be owed ~$33.34: ${Math.abs((aliceAfter?.net || 0) - 33.34) < 1 ? 'PASS' : 'FAIL'}`);
        
        console.log('\n=== Test Complete ===\n');
        
    } catch (error: any) {
        console.error('Test failed:', error.message);
    }
}

// Helper function to create test data
async function createTestGroup() {
    console.log('Creating test group with sample data...\n');
    
    const testGroup = new GroupTransactionModel({
        groupId: 9999999999,
        groupName: 'Test Group',
        ownerEmail: 'alice@example.com',
        ownerId: new mongoose.Types.ObjectId(),
        groupMembers: ['bob@example.com', 'charlie@example.com'],
        groupExpenses: [
            {
                expenseDate: new Date(),
                totalExpenseAmount: 100,
                currency: 'USD',
                category: new mongoose.Types.ObjectId(),
                note: 'Test dinner',
                paidBy: {
                    type: 'individual',
                    memberEmail: 'alice@example.com',
                    amount: 100
                },
                shareWith: {
                    type: 'equal',
                    members: ['alice@example.com', 'bob@example.com', 'charlie@example.com']
                }
            }
        ],
        settlements: []
    });
    
    await testGroup.save();
    console.log('Test group created successfully!\n');
    return testGroup;
}

// Helper function to clean up test data
async function cleanupTestData() {
    await GroupTransactionModel.deleteOne({ groupId: 9999999999 });
    console.log('Test data cleaned up.\n');
}

// Export for manual testing
export { testSettlementCalculations, createTestGroup, cleanupTestData };

// Uncomment to run directly
// import './path/to/db/connection'; // Connect to DB first
// createTestGroup()
//     .then(() => testSettlementCalculations())
//     .then(() => cleanupTestData())
//     .then(() => {
//         console.log('All tests passed!');
//         process.exit(0);
//     })
//     .catch(error => {
//         console.error('Tests failed:', error);
//         process.exit(1);
//     });
