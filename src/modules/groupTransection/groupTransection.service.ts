import mongoose from "mongoose";
import { GroupTransactionModel } from "./groupTransection.model";
import { UserModel } from "../user/user.model";

const createGroupTransaction = async ({ groupName, user_id }: { groupName: string, user_id: mongoose.Types.ObjectId | null }) => {
    try {

        const generatedGroupId = new mongoose.Types.ObjectId();

        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        const newGroup = new GroupTransactionModel({
            groupId: generatedGroupId.getTimestamp().getTime(),
            groupName,
            ownerId: user_id,
            ownerEmail: userEmail,
        });
        await newGroup.save();
        return newGroup;
    } catch (error: any) {
        console.error('Error in createGroupTransaction service:', error.message);
        throw new Error(`Failed to create group transaction: ${error.message}`);
    }
};

const addGroupMember = async ({ groupId, members, user_id }: { groupId: string, members: string[], user_id: mongoose.Types.ObjectId | null }) => {
    try {

        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Add new members to the groupMembers array, avoiding duplicates
        group.groupMembers = Array.from(new Set([...(group.groupMembers ?? []), ...members]));

        await group.save();
        return group;

    } catch (error: any) {
        console.error('Error in addGroupMember service:', error.message);
        throw new Error(`Failed to add group member: ${error.message}`);
    }
};


const addGroupExpense = async ({ groupId, expenseData, user_id }: { groupId: string, expenseData: any, user_id: mongoose.Types.ObjectId | null }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the group
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) }).session(session);

        if (!group) {
            throw new Error('Group not found');
        }

        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Verify user is group owner or member
        const isOwner = group.ownerId?.toString() === user_id?.toString();
        const isMember = group.groupMembers?.includes(userEmail?.toString() || '');

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to add expenses to this group');
        }

        // Validate required expense data
        const {
            expenseDate,
            totalExpenseAmount,
            currency,
            category,
            note,
            paidBy,
            shareWith
        } = expenseData;

        // Basic validation
        if (!expenseDate || !totalExpenseAmount || !currency || !category || !paidBy || !shareWith) {
            throw new Error('Missing required expense fields: expenseDate, totalExpenseAmount, currency, category, paidBy, shareWith');
        }

        if (totalExpenseAmount <= 0) {
            throw new Error('Total expense amount must be greater than 0');
        }

        // Validate paidBy structure
        await validatePaidBy(paidBy, totalExpenseAmount, group);

        // Validate shareWith structure
        await validateShareWith(shareWith, totalExpenseAmount, group);

        // Create expense object
        const newExpense = {
            expenseDate: new Date(expenseDate),
            totalExpenseAmount,
            currency,
            category: new mongoose.Types.ObjectId(category),
            note: note || '',
            paidBy,
            shareWith
        };

        // Add expense to group
        if (!group.groupExpenses) {
            group.groupExpenses = [];
        }

        group.groupExpenses.push(newExpense as any);

        // Save the updated group
        const updatedGroup = await group.save({ session });

        await session.commitTransaction();
        return updatedGroup;

    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error in addGroupExpense service:', error.message);
        throw new Error(`Failed to add group expense: ${error.message}`);
    } finally {
        session.endSession();
    }
};

// Helper function to validate paidBy structure
const validatePaidBy = async (paidBy: any, totalAmount: number, group: any) => {
    if (!paidBy.type || !['individual', 'multiple'].includes(paidBy.type)) {
        throw new Error('paidBy.type must be either "individual" or "multiple"');
    }

    if (paidBy.type === 'individual') {
        if (!paidBy.memberEmail || !paidBy.amount) {
            throw new Error('For individual payment, memberEmail and amount are required');
        }

        if (paidBy.amount !== totalAmount) {
            throw new Error('For individual payment, amount must equal totalExpenseAmount');
        }

        // Verify member exists in group
        const memberExists = group.ownerEmail === paidBy.memberEmail || 
                           group.groupMembers?.includes(paidBy.memberEmail);
        
        if (!memberExists) {
            throw new Error('Paying member is not part of this group');
        }

    } else if (paidBy.type === 'multiple') {
        if (!paidBy.payments || !Array.isArray(paidBy.payments) || paidBy.payments.length === 0) {
            throw new Error('For multiple payments, payments array is required');
        }

        let totalPaid = 0;
        const memberEmails = new Set();

        for (const payment of paidBy.payments) {
            if (!payment.memberEmail || !payment.amount) {
                throw new Error('Each payment must have memberEmail and amount');
            }

            if (payment.amount <= 0) {
                throw new Error('Payment amount must be greater than 0');
            }

            // Check for duplicate members
            if (memberEmails.has(payment.memberEmail)) {
                throw new Error('Duplicate member in payments array');
            }
            memberEmails.add(payment.memberEmail);

            // Verify member exists in group
            const memberExists = group.ownerEmail === payment.memberEmail || 
                               group.groupMembers?.includes(payment.memberEmail);
            
            if (!memberExists) {
                throw new Error(`Paying member ${payment.memberEmail} is not part of this group`);
            }

            totalPaid += payment.amount;
        }

        // Allow small floating-point differences
        if (Math.abs(totalPaid - totalAmount) > 0.01) {
            throw new Error(`Total payments (${totalPaid}) must equal totalExpenseAmount (${totalAmount})`);
        }
    }
};

// Helper function to validate shareWith structure
const validateShareWith = async (shareWith: any, totalAmount: number, group: any) => {
    if (!shareWith.type || !['equal', 'custom'].includes(shareWith.type)) {
        throw new Error('shareWith.type must be either "equal" or "custom"');
    }

    if (shareWith.type === 'equal') {
        if (!shareWith.members || !Array.isArray(shareWith.members) || shareWith.members.length === 0) {
            throw new Error('For equal sharing, members array is required');
        }

        // Verify all members exist in group
        for (const memberEmail of shareWith.members) {
            const memberExists = group.ownerEmail === memberEmail || 
                               group.groupMembers?.includes(memberEmail);
            
            if (!memberExists) {
                throw new Error(`Sharing member ${memberEmail} is not part of this group`);
            }
        }

        // Check for duplicate members
        const uniqueMembers = new Set(shareWith.members);
        if (uniqueMembers.size !== shareWith.members.length) {
            throw new Error('Duplicate members in sharing list');
        }

    } else if (shareWith.type === 'custom') {
        if (!shareWith.shares || !Array.isArray(shareWith.shares) || shareWith.shares.length === 0) {
            throw new Error('For custom sharing, shares array is required');
        }

        let totalShares = 0;
        const memberEmails = new Set();

        for (const share of shareWith.shares) {
            if (!share.memberEmail || !share.amount) {
                throw new Error('Each share must have memberEmail and amount');
            }

            if (share.amount <= 0) {
                throw new Error('Share amount must be greater than 0');
            }

            // Check for duplicate members
            if (memberEmails.has(share.memberEmail)) {
                throw new Error('Duplicate member in shares array');
            }
            memberEmails.add(share.memberEmail);

            // Verify member exists in group
            const memberExists = group.ownerEmail === share.memberEmail || 
                               group.groupMembers?.includes(share.memberEmail);
            
            if (!memberExists) {
                throw new Error(`Sharing member ${share.memberEmail} is not part of this group`);
            }

            totalShares += share.amount;
        }

        // Allow small floating-point differences
        if (Math.abs(totalShares - totalAmount) > 0.01) {
            throw new Error(`Total shares (${totalShares}) must equal totalExpenseAmount (${totalAmount})`);
        }
    }
};

// Calculate group balances and debts
const calculateGroupBalances = async (groupId: string) => {
    try {
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group || !group.groupExpenses) {
            throw new Error('Group not found or no expenses');
        }

        // Create member balance map
        const memberBalances: { [key: string]: { paid: number, owes: number, net: number } } = {};
        
        // Initialize all members
        const allMembers = [
            ...(group.ownerEmail ? [group.ownerEmail] : []),
            ...(group.groupMembers || [])
        ];
        
        allMembers.forEach(memberEmail => {
            memberBalances[memberEmail] = { paid: 0, owes: 0, net: 0 };
        });

        // Process each expense
        for (const expense of group.groupExpenses) {
            // Calculate who paid what
            if (expense.paidBy.type === 'individual') {
                const payerEmail = expense.paidBy.memberEmail;
                memberBalances[payerEmail].paid += expense.paidBy.amount;
            } else {
                expense.paidBy.payments?.forEach(payment => {
                    const payerEmail = payment.memberEmail;
                    memberBalances[payerEmail].paid += payment.amount;
                });
            }

            // Calculate who owes what
            if (expense.shareWith.type === 'equal') {
                const shareAmount = expense.totalExpenseAmount / expense.shareWith.members.length;
                expense.shareWith.members.forEach(memberEmail => {
                    memberBalances[memberEmail].owes += shareAmount;
                });
            } else {
                expense.shareWith.shares?.forEach(share => {
                    const memberEmail = share.memberEmail;
                    memberBalances[memberEmail].owes += share.amount;
                });
            }
        }

        // Calculate net balances
        Object.keys(memberBalances).forEach(memberEmail => {
            memberBalances[memberEmail].net = memberBalances[memberEmail].paid - memberBalances[memberEmail].owes;
        });        return memberBalances;
    } catch (error: any) {
        console.error('Error in calculateGroupBalances:', error.message);
        throw new Error(`Failed to calculate group balances: ${error.message}`);
    }
};

// Get group summary with balances
const getGroupSummary = async (groupId: string) => {
    try {
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) })
            .populate('groupExpenses.category')
            .populate('ownerId', 'name email');

        if (!group) {
            throw new Error('Group not found');
        }

        const balances = await calculateGroupBalances(groupId);

        // Calculate total expenses
        const totalExpenses = group.groupExpenses?.reduce((sum, expense) => sum + expense.totalExpenseAmount, 0) || 0;

        // Get expense categories breakdown
        const categoryBreakdown: { [key: string]: number } = {};
        group.groupExpenses?.forEach(expense => {
            const categoryName = (expense.category as any)?.name || 'Unknown';
            categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + expense.totalExpenseAmount;
        });

        return {
            group: {
                groupId: group.groupId,
                groupName: group.groupName,
                ownerId: group.ownerId,
                memberCount: (group.groupMembers?.length || 0) + 1, // +1 for owner
                totalExpenses,
                expenseCount: group.groupExpenses?.length || 0
            },
            balances,
            categoryBreakdown,
            recentExpenses: group.groupExpenses?.slice(-5) || [] // Last 5 expenses
        };
    } catch (error: any) {
        console.error('Error in getGroupSummary:', error.message);
        throw new Error(`Failed to get group summary: ${error.message}`);
    }
};

// Settle debt between members (future feature)
const settleDebt = async (groupId: string, fromMemberId: string, toMemberId: string, amount: number) => {
    // This would be implemented for recording settlements
    // For now, return a placeholder
    return {
        message: 'Debt settlement feature coming soon',
        groupId,
        settlement: {
            from: fromMemberId,
            to: toMemberId,
            amount,
            date: new Date()
        }
    };
};

const groupTransactionServices = {
    createGroupTransaction,
    addGroupMember,
    addGroupExpense,
    calculateGroupBalances,
    getGroupSummary,
    settleDebt
};

export default groupTransactionServices;