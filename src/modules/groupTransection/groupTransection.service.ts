import mongoose from "mongoose";
import { GroupTransactionModel } from "./groupTransection.model";
import { UserModel } from "../user/user.model";
import { UserSubscriptionModel } from "../userSubscription/userSubscription.model";
import idConverter from "../../util/idConverter";

// Get comprehensive group status with summary and breakdowns
const getGroupStatus = async ({
    groupId,
    user_id
}: {
    groupId: string,
    user_id: mongoose.Types.ObjectId | null
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group with populated category data
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) })
            .populate('groupExpenses.category', 'name')
            .lean();

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to view this group status');
        }

        // Get all group members including owner
        const allMembers = [group.ownerEmail, ...(group.groupMembers || [])];

        // Determine involved currencies (get unique currencies from expenses)
        const involvedCurrencies = [...new Set((group.groupExpenses || []).map(exp => exp.currency))];
        const defaultCurrency = involvedCurrencies.length === 1 ? involvedCurrencies[0] : 'USD';

        // Calculate balances for all members
        const balances = await calculateGroupBalances(groupId);

        // Initialize summary data
        let totalGroupExpenses = 0;
        let userTotalPaid = 0;
        let userTotalOwes = 0;

        // Category-wise breakdown
        const categoryBreakdown: {
            [categoryName: string]: {
                totalAmount: number,
                userPaid: number,
                userOwes: number,
                percentage: number,
                currency: string
            }
        } = {};

        // Person-wise breakdown
        const personBreakdown: {
            [email: string]: {
                totalInvolved: number,
                userPaidToThem: number,
                userOwesFromThem: number,
                percentage: number,
                currency: string
            }
        } = {};

        // Initialize person breakdown for all group members
        for (const memberEmail of allMembers) {
            if (memberEmail) { // Type guard to ensure memberEmail is not undefined
                personBreakdown[memberEmail] = {
                    totalInvolved: 0,
                    userPaidToThem: 0,
                    userOwesFromThem: 0,
                    percentage: 0,
                    currency: defaultCurrency
                };
            }
        }

        // Process each expense
        for (const expense of group.groupExpenses || []) {
            totalGroupExpenses += expense.totalExpenseAmount;

            const categoryName = (expense.category as any)?.name || 'Unknown';

            // Initialize category if not exists
            if (!categoryBreakdown[categoryName]) {
                categoryBreakdown[categoryName] = {
                    totalAmount: 0,
                    userPaid: 0,
                    userOwes: 0,
                    percentage: 0,
                    currency: expense.currency
                };
            }

            // Add to category total
            categoryBreakdown[categoryName].totalAmount += expense.totalExpenseAmount;

            // Calculate user's payment for this expense
            let userPaidInExpense = 0;
            if (expense.paidBy.type === 'individual' && expense.paidBy.memberEmail === userEmail) {
                userPaidInExpense = expense.paidBy.amount;
            } else if (expense.paidBy.type === 'multiple') {
                const userPayment = expense.paidBy.payments?.find(p => p.memberEmail === userEmail);
                userPaidInExpense = userPayment?.amount || 0;
            }

            userTotalPaid += userPaidInExpense;
            categoryBreakdown[categoryName].userPaid += userPaidInExpense;

            // Calculate user's share for this expense
            let userOwesInExpense = 0;
            if (expense.shareWith.type === 'equal' && expense.shareWith.members.includes(userEmail)) {
                userOwesInExpense = expense.totalExpenseAmount / expense.shareWith.members.length;
            } else if (expense.shareWith.type === 'custom') {
                const userShare = expense.shareWith.shares?.find(s => s.memberEmail === userEmail);
                userOwesInExpense = userShare?.amount || 0;
            }

            userTotalOwes += userOwesInExpense;
            categoryBreakdown[categoryName].userOwes += userOwesInExpense;

            // Track total involvement for each person who paid
            if (expense.paidBy.type === 'individual') {
                const payerEmail: string = expense.paidBy.memberEmail;
                if (personBreakdown[payerEmail]) {
                    personBreakdown[payerEmail].totalInvolved += expense.paidBy.amount;
                }
            } else if (expense.paidBy.type === 'multiple') {
                for (const payment of expense.paidBy.payments || []) {
                    if (personBreakdown[payment.memberEmail]) {
                        personBreakdown[payment.memberEmail].totalInvolved += payment.amount;
                    }
                }
            }
        }

        // Calculate percentages for categories
        for (const category in categoryBreakdown) {
            if (totalGroupExpenses > 0) {
                categoryBreakdown[category].percentage = (categoryBreakdown[category].totalAmount / totalGroupExpenses) * 100;
            }
        }

        // Calculate percentages for persons and clean up data
        for (const person in personBreakdown) {
            if (totalGroupExpenses > 0) {
                personBreakdown[person].percentage = (personBreakdown[person].totalInvolved / totalGroupExpenses) * 100;
            }
        }

        // Calculate user's involvement percentage
        const userInvolvementPercentage = totalGroupExpenses > 0 ? (userTotalOwes / totalGroupExpenses) * 100 : 0;

        // Get user's net balance
        const userBalance = balances[userEmail] || { paid: 0, owes: 0, net: 0 };

        return {
            group: {
                groupId: group.groupId,
                groupName: group.groupName,
                ownerEmail: group.ownerEmail,
                totalMembers: allMembers.length,
                totalExpenses: totalGroupExpenses
            },
            summary: {
                involvedCurrency: involvedCurrencies.length === 1 ? involvedCurrencies[0] : 'Mixed',
                involvedAmount: userTotalOwes,
                myExpensesPercentage: parseFloat(userInvolvementPercentage.toFixed(2)),
                myExpensesCurrency: involvedCurrencies.length === 1 ? involvedCurrencies[0] : 'Mixed',
                myExpensesAmount: userTotalPaid,
                netBalance: {
                    amount: Math.abs(userBalance.net),
                    status: userBalance.net > 0 ? 'you_are_owed' : userBalance.net < 0 ? 'you_owe' : 'settled',
                    currency: involvedCurrencies.length === 1 ? involvedCurrencies[0] : 'Mixed'
                }
            },
            categoryWise: Object.keys(categoryBreakdown).map(categoryName => ({
                categoryName,
                involved: {
                    currency: categoryBreakdown[categoryName].currency,
                    amount: categoryBreakdown[categoryName].totalAmount,
                    percentage: parseFloat(categoryBreakdown[categoryName].percentage.toFixed(2))
                },
                myExpense: {
                    currency: categoryBreakdown[categoryName].currency,
                    amount: categoryBreakdown[categoryName].userPaid,
                    percentage: categoryBreakdown[categoryName].totalAmount > 0 ?
                        parseFloat(((categoryBreakdown[categoryName].userPaid / categoryBreakdown[categoryName].totalAmount) * 100).toFixed(2)) : 0
                }
            })).sort((a, b) => b.involved.amount - a.involved.amount),
            personWise: Object.keys(personBreakdown).map(email => {
                const memberTotalInvolved = personBreakdown[email].totalInvolved;
                const memberPercentage = totalGroupExpenses > 0 ? (memberTotalInvolved / totalGroupExpenses) * 100 : 0;

                // Calculate user's expense related to this person (how much user paid for expenses involving this person)
                let userExpenseForThisPerson = 0;
                let userExpensePercentageForThisPerson = 0;

                // Go through all expenses and see which ones involve this person
                for (const expense of group.groupExpenses || []) {
                    let personInvolvedInExpense = false;

                    // Check if this person paid for the expense
                    if (expense.paidBy.type === 'individual' && expense.paidBy.memberEmail === email) {
                        personInvolvedInExpense = true;
                    } else if (expense.paidBy.type === 'multiple') {
                        personInvolvedInExpense = expense.paidBy.payments?.some(p => p.memberEmail === email) || false;
                    }

                    // Check if this person is in the shareWith
                    if (expense.shareWith.type === 'equal' && expense.shareWith.members.includes(email)) {
                        personInvolvedInExpense = true;
                    } else if (expense.shareWith.type === 'custom') {
                        personInvolvedInExpense = expense.shareWith.shares?.some(s => s.memberEmail === email) || false;
                    }

                    // If this person is involved in the expense, calculate user's payment for this expense
                    if (personInvolvedInExpense) {
                        if (expense.paidBy.type === 'individual' && expense.paidBy.memberEmail === userEmail) {
                            userExpenseForThisPerson += expense.paidBy.amount;
                        } else if (expense.paidBy.type === 'multiple') {
                            const userPayment = expense.paidBy.payments?.find(p => p.memberEmail === userEmail);
                            userExpenseForThisPerson += userPayment?.amount || 0;
                        }
                    }
                }

                userExpensePercentageForThisPerson = memberTotalInvolved > 0 ? (userExpenseForThisPerson / memberTotalInvolved) * 100 : 0;

                return {
                    memberEmail: email,
                    involved: {
                        currency: personBreakdown[email].currency,
                        amount: memberTotalInvolved,
                        percentage: parseFloat(memberPercentage.toFixed(2))
                    },
                    myExpense: {
                        currency: personBreakdown[email].currency,
                        amount: userExpenseForThisPerson,
                        percentage: parseFloat(userExpensePercentageForThisPerson.toFixed(2))
                    }
                };
            }).sort((a, b) => b.involved.amount - a.involved.amount),
            currencies: involvedCurrencies,
            lastUpdated: new Date().toISOString()
        };

    } catch (error: any) {
        console.error('Error in getGroupStatus service:', error.message);
        throw new Error(`Failed to get group status: ${error.message}`);
    }
};

const createGroupTransaction = async ({ groupName, user_id }: { groupName: string, user_id: mongoose.Types.ObjectId | null }) => {
    try {
        if (!user_id) {
            throw new Error('User ID is required');
        }

        // Get user email for the new group
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        const existingGroup = await GroupTransactionModel.find({ ownerId: user_id }).countDocuments();

        const isPaidUser = await UserSubscriptionModel.find({ user: user_id, status: { $in: ['active', 'completed'] }, endDate: { $gt: new Date() } }).countDocuments() > 0;

        if (existingGroup === 2 && !isPaidUser) {
            throw new Error('Group limit reached. You can only create up to 2 groups in free tier.');
        }

        const generatedGroupId = Math.floor(Date.now() / 1000);
        const newGroup = new GroupTransactionModel({
            groupId: generatedGroupId,
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


const getGroups = async ({ user_id }: { user_id: mongoose.Types.ObjectId | null }) => {
    try {
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        const groups = await GroupTransactionModel.find({
            $or: [
                { ownerId: user_id },
                { groupMembers: userEmail }
            ]
        }).lean();

        // Process each group to add comprehensive information
        const processedGroups = await Promise.all(groups.map(async (group) => {
            try {
                // Ensure groupId exists
                if (!group.groupId) {
                    throw new Error('Group ID is missing');
                }

                // Get group expenses for currency determination (moved up to avoid redeclaration)
                const groupExpenses = group.groupExpenses || [];
                const involvedCurrencies = [...new Set(groupExpenses.map((exp: any) => exp.currency))];
                const defaultCurrency = involvedCurrencies.length === 1 ? involvedCurrencies[0] : 'USD';

                // Calculate user's financial summary for this group
                const balances = await calculateGroupBalances(group.groupId.toString());
                const userBalance = balances[userEmail] || { paid: 0, owes: 0, net: 0 };

                // Calculate detailed you'll pay and you'll collect arrays
                const youllPayDetails: Array<{
                    memberEmail: string,
                    currency: string,
                    amount: number
                }> = [];

                const youllCollectDetails: Array<{
                    memberEmail: string,
                    currency: string,
                    amount: number
                }> = [];

                // Process each member's balance with current user
                for (const [memberEmail, memberBalance] of Object.entries(balances)) {
                    if (memberEmail !== userEmail) {
                        // Calculate relationship: if memberBalance.net > 0, they are owed money
                        // if memberBalance.net < 0, they owe money
                        // From current user's perspective: if member owes money, user should collect
                        // if member is owed money, user should pay

                        if (memberBalance.net > 0) {
                            // Member is owed money, so current user owes them (user should pay)
                            youllPayDetails.push({
                                memberEmail,
                                currency: defaultCurrency,
                                amount: memberBalance.net
                            });
                        } else if (memberBalance.net < 0) {
                            // Member owes money, so current user should collect from them
                            youllCollectDetails.push({
                                memberEmail,
                                currency: defaultCurrency,
                                amount: Math.abs(memberBalance.net)
                            });
                        }
                    }
                }

                // Calculate totals for backward compatibility
                const totalYoullPay = youllPayDetails.reduce((sum, item) => sum + item.amount, 0);
                const totalYoullCollect = youllCollectDetails.reduce((sum, item) => sum + item.amount, 0);

                // Calculate total group expenses
                const totalExpenses = groupExpenses.reduce((sum: number, expense: any) => sum + expense.totalExpenseAmount, 0);

                // Get all group members including owner
                const allMembers = [group.ownerEmail, ...(group.groupMembers || [])].filter(Boolean);

                return {
                    groupId: group.groupId,
                    groupName: group.groupName,
                    groupCreateDate: (group as any).createdAt || new Date(group.groupId * 1000), // Use createdAt or fallback
                    isOwner: group.ownerEmail === userEmail,
                    ownerEmail: group.ownerEmail,
                    groupMembers: group.groupMembers || [],
                    totalMembers: allMembers.length,
                    memberDetails: allMembers.map(email => ({
                        email,
                        isOwner: email === group.ownerEmail,
                        isCurrentUser: email === userEmail
                    })),
                    financialSummary: {
                        youllPay: youllPayDetails,
                        youllCollect: youllCollectDetails,
                        totalYoullPay: {
                            currency: defaultCurrency,
                            amount: totalYoullPay
                        },
                        totalYoullCollect: {
                            currency: defaultCurrency,
                            amount: totalYoullCollect
                        },
                        netBalance: {
                            amount: Math.abs(userBalance.net),
                            status: userBalance.net > 0 ? 'you_are_owed' : userBalance.net < 0 ? 'you_owe' : 'settled',
                            currency: defaultCurrency
                        }
                    },
                    groupStats: {
                        totalExpenses,
                        expenseCount: groupExpenses.length,
                        currencies: involvedCurrencies,
                        lastExpenseDate: groupExpenses.length > 0 ?
                            new Date(Math.max(...groupExpenses.map((exp: any) => new Date(exp.expenseDate).getTime()))) :
                            null
                    }
                };
            } catch (error) {
                console.error(`Error processing group ${group.groupId}:`, error);
                // Return basic group info if processing fails
                const fallbackGroupId = group.groupId || 0;
                return {
                    groupId: fallbackGroupId,
                    groupName: group.groupName,
                    groupCreateDate: (group as any).createdAt || new Date(fallbackGroupId * 1000),
                    isOwner: group.ownerEmail === userEmail,
                    ownerEmail: group.ownerEmail,
                    groupMembers: group.groupMembers || [],
                    totalMembers: (group.groupMembers?.length || 0) + 1,
                    memberDetails: [],
                    financialSummary: {
                        youllPay: [],
                        youllCollect: [],
                        totalYoullPay: { currency: 'USD', amount: 0 },
                        totalYoullCollect: { currency: 'USD', amount: 0 },
                        netBalance: { amount: 0, status: 'settled', currency: 'USD' }
                    },
                    groupStats: {
                        totalExpenses: 0,
                        expenseCount: 0,
                        currencies: ['USD'],
                        lastExpenseDate: null
                    },
                    error: 'Failed to load financial data'
                };
            }
        }));

        // Sort groups by creation date (newest first)
        processedGroups.sort((a, b) => new Date(b.groupCreateDate).getTime() - new Date(a.groupCreateDate).getTime());

        return {
            totalGroups: processedGroups.length,
            groups: processedGroups
        };

    } catch (error: any) {
        console.error('Error in getGroups service:', error.message);
        throw new Error(`Failed to get groups: ${error.message}`);
    }
};

const getGroupsByUserId = async ({ userId }: { userId: mongoose.Types.ObjectId | null }) => {

    const result = await GroupTransactionModel.find({ ownerId: userId });
    return result;

}


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

        const modifyPaidBy = { ...paidBy, amount: totalExpenseAmount };

        // Create expense object
        const newExpense = {
            expenseDate: new Date(expenseDate),
            totalExpenseAmount,
            currency,
            category: new mongoose.Types.ObjectId(category),
            note: note || '',
            paidBy: modifyPaidBy,
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
        if (!paidBy.memberEmail || !totalAmount) {
            throw new Error('For individual payment, memberEmail and amount are required');
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
        }); return memberBalances;
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

        // Prepare comprehensive members list
        const allMemberEmails = [group.ownerEmail, ...(group.groupMembers || [])];
        const membersList = [];

        // Get owner details
        const ownerInfo = group.ownerId as any;
        const ownerBalance = balances[group.ownerEmail || ''] || { paid: 0, owes: 0, net: 0 };

        membersList.push({
            email: group.ownerEmail,
            name: ownerInfo?.name || 'Unknown',
            role: 'owner',
            isOwner: true,
            balance: {
                paid: ownerBalance.paid,
                owes: ownerBalance.owes,
                net: ownerBalance.net,
                status: ownerBalance.net > 0 ? 'is_owed' : ownerBalance.net < 0 ? 'owes' : 'settled'
            }
        });

        // Get member details for group members
        for (const memberEmail of (group.groupMembers || [])) {
            const memberUser = await UserModel.findOne({ email: memberEmail }).select('name email').lean();
            const memberBalance = balances[memberEmail] || { paid: 0, owes: 0, net: 0 };

            membersList.push({
                email: memberEmail,
                name: memberUser?.name || 'Unknown',
                role: 'member',
                isOwner: false,
                balance: {
                    paid: memberBalance.paid,
                    owes: memberBalance.owes,
                    net: memberBalance.net,
                    status: memberBalance.net > 0 ? 'is_owed' : memberBalance.net < 0 ? 'owes' : 'settled'
                }
            });
        }

        return {
            group: {
                groupId: group.groupId,
                groupName: group.groupName,
                ownerId: group.ownerId,
                ownerEmail: group.ownerEmail,
                memberCount: (group.groupMembers?.length || 0) + 1, // +1 for owner
                totalExpenses,
                expenseCount: group.groupExpenses?.length || 0,
                createdAt: (group as any).createdAt,
                updatedAt: (group as any).updatedAt
            },
            members: membersList,
            balances,
            categoryBreakdown,
            recentExpenses: group.groupExpenses?.slice(-5) || [] // Last 5 expenses
        };
    } catch (error: any) {
        console.error('Error in getGroupSummary:', error.message);
        throw new Error(`Failed to get group summary: ${error.message}`);
    }
};

// Calculate optimal settlements - who should pay whom to settle all debts
const calculateOptimalSettlements = async (groupId: string) => {
    try {
        const balances = await calculateGroupBalances(groupId);

        // Separate creditors (positive balance) and debtors (negative balance)
        const creditors: { email: string; amount: number }[] = [];
        const debtors: { email: string; amount: number }[] = [];

        Object.entries(balances).forEach(([email, balance]) => {
            if (balance.net > 0.01) { // They are owed money (creditor)
                creditors.push({ email, amount: balance.net });
            } else if (balance.net < -0.01) { // They owe money (debtor)
                debtors.push({ email, amount: Math.abs(balance.net) });
            }
        });

        // Calculate optimal settlements using greedy algorithm
        const settlements: { from: string; to: string; amount: number }[] = [];

        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settleAmount = Math.min(debtor.amount, creditor.amount);

            if (settleAmount > 0.01) {
                settlements.push({
                    from: debtor.email,
                    to: creditor.email,
                    amount: Math.round(settleAmount * 100) / 100 // Round to 2 decimal places
                });
            }

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount <= 0.01) i++;
            if (creditor.amount <= 0.01) j++;
        }

        return settlements;
    } catch (error: any) {
        console.error('Error in calculateOptimalSettlements:', error.message);
        throw new Error(`Failed to calculate settlements: ${error.message}`);
    }
};

// Get group settlements data for "Slice up" feature
const getGroupSettlements = async ({
    groupId,
    user_id
}: {
    groupId: string,
    user_id: mongoose.Types.ObjectId | null
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) }).lean();

        if (!group) {
            throw new Error('Group not found');
        }

        console.log('Group found:', group);

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to view this group settlements');
        }

        // Get balances and settlements
        const balances = await calculateGroupBalances(groupId);
        const settlements = await calculateOptimalSettlements(groupId);

        // Prepare total balance data
        const totalBalances = Object.entries(balances).map(([email, balance]) => ({
            memberEmail: email,
            netBalance: Math.round(balance.net * 100) / 100,
            totalPaid: Math.round(balance.paid * 100) / 100,
            totalOwes: Math.round(balance.owes * 100) / 100
        }));

        // Calculate total expenses
        const totalExpenses = group.groupExpenses?.reduce((sum, expense) => sum + expense.totalExpenseAmount, 0) || 0;

        // Calculate user-specific summary
        const userBalance = balances[userEmail] || { paid: 0, owes: 0, net: 0 };
        const youllPay = userBalance.net < 0 ? Math.abs(userBalance.net) : 0;
        const youllCollect = userBalance.net > 0 ? userBalance.net : 0;

        // Prepare group info
        const groupInfo = {
            groupId: parseInt(groupId),
            groupName: group.groupName,
            ownerEmail: group.ownerEmail,
            groupMembers: group.groupMembers || [],
            totalMembers: (group.groupMembers?.length || 0) + 1 // +1 for owner
        };

        // Prepare summary info
        const summaryInfo = {
            youllPay: {
                currency: "USD", // Default currency, could be made configurable
                amount: Math.round(youllPay * 100) / 100
            },
            youllCollect: {
                currency: "USD", // Default currency, could be made configurable  
                amount: Math.round(youllCollect * 100) / 100
            },
            totalExpenses: Math.round(totalExpenses * 100) / 100,
            totalUserBorrowed: Math.round((userBalance.owes - userBalance.paid) * 100) / 100,
            totalUserLent: Math.round((userBalance.paid - userBalance.owes) * 100) / 100
        };

        return {
            group: groupInfo,
            summary: summaryInfo,
            settlements: settlements,
            totalBalances: totalBalances,
            isAllSettled: settlements.length === 0
        };

    } catch (error: any) {
        console.error('Error in getGroupSettlements:', error.message);
        throw new Error(`Failed to get group settlements: ${error.message}`);
    }
};

// Settle a specific debt between two members
const settleDebt = async ({
    groupId,
    fromEmail,
    toEmail,
    amount,
    user_id
}: {
    groupId: string,
    fromEmail: string,
    toEmail: string,
    amount: number,
    user_id: mongoose.Types.ObjectId | null
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to settle debts in this group');
        }

        // Verify the settlement is valid
        const currentBalances = await calculateGroupBalances(groupId);
        const fromBalance = currentBalances[fromEmail]?.net || 0;
        const toBalance = currentBalances[toEmail]?.net || 0;

        // Check if the settlement makes sense
        if (fromBalance >= 0) {
            throw new Error(`${fromEmail} does not owe money`);
        }

        if (toBalance <= 0) {
            throw new Error(`${toEmail} is not owed money`);
        }

        if (amount > Math.abs(fromBalance)) {
            throw new Error(`Settlement amount cannot exceed the debt amount`);
        }

        if (amount > toBalance) {
            throw new Error(`Settlement amount cannot exceed what is owed to ${toEmail}`);
        }

        // Record the settlement as a new expense
        // This settlement expense will adjust the balances
        const settlementExpense = {
            expenseDate: new Date(),
            totalExpenseAmount: amount,
            currency: 'USD' as const, // Default currency, could be configurable
            category: new mongoose.Types.ObjectId(), // You might want to create a special "Settlement" category
            note: `Settlement: ${fromEmail} paid ${toEmail}`,
            paidBy: {
                type: 'individual' as const,
                memberEmail: fromEmail,
                amount: amount
            },
            shareWith: {
                type: 'custom' as const,
                shares: [{
                    memberEmail: toEmail,
                    amount: amount
                }]
            }
        };

        group.groupExpenses = group.groupExpenses || [];
        group.groupExpenses.push(settlementExpense);

        await group.save();

        // Return updated settlement data
        const updatedSettlements = await getGroupSettlements({ groupId, user_id });

        return {
            message: 'Debt settled successfully',
            settlement: {
                from: fromEmail,
                to: toEmail,
                amount: amount,
                date: new Date()
            },
            updatedData: updatedSettlements
        };

    } catch (error: any) {
        console.error('Error in settleDebt:', error.message);
        throw new Error(`Failed to settle debt: ${error.message}`);
    }
};

// Settle multiple debts between group members
const settleMultipleDebts = async ({
    groupId,
    settlements,
    user_id
}: {
    groupId: string,
    settlements: Array<{
        fromEmail: string,
        toEmail: string,
        amount: number
    }>,
    user_id: mongoose.Types.ObjectId | null
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to settle debts in this group');
        }

        // Get current balances to validate all settlements
        const currentBalances = await calculateGroupBalances(groupId);

        // Validate all settlements before processing any
        const validationErrors: string[] = [];

        settlements.forEach((settlement, index) => {
            const { fromEmail, toEmail, amount } = settlement;

            const fromBalance = currentBalances[fromEmail]?.net || 0;
            const toBalance = currentBalances[toEmail]?.net || 0;

            // Check if the settlement makes sense
            if (fromBalance >= 0) {
                validationErrors.push(`Settlement ${index + 1}: ${fromEmail} does not owe money`);
            }

            if (toBalance <= 0) {
                validationErrors.push(`Settlement ${index + 1}: ${toEmail} is not owed money`);
            }

            if (amount > Math.abs(fromBalance)) {
                validationErrors.push(`Settlement ${index + 1}: amount cannot exceed the debt amount`);
            }

            if (amount > toBalance) {
                validationErrors.push(`Settlement ${index + 1}: amount cannot exceed what is owed to ${toEmail}`);
            }
        });

        if (validationErrors.length > 0) {
            throw new Error(`Validation errors: ${validationErrors.join('; ')}`);
        }

        // Process all settlements
        const settlementResults: Array<{
            from: string,
            to: string,
            amount: number,
            date: Date
        }> = [];

        for (const settlement of settlements) {
            const { fromEmail, toEmail, amount } = settlement;

            // Record each settlement as a new expense
            const settlementExpense = {
                expenseDate: new Date(),
                totalExpenseAmount: amount,
                currency: 'USD' as const, // Default currency, could be configurable
                category: new mongoose.Types.ObjectId(), // You might want to create a special "Settlement" category
                note: `Settlement: ${fromEmail} paid ${toEmail}`,
                paidBy: {
                    type: 'individual' as const,
                    memberEmail: fromEmail,
                    amount: amount
                },
                shareWith: {
                    type: 'custom' as const,
                    shares: [{
                        memberEmail: toEmail,
                        amount: amount
                    }]
                }
            };

            group.groupExpenses = group.groupExpenses || [];
            group.groupExpenses.push(settlementExpense);

            settlementResults.push({
                from: fromEmail,
                to: toEmail,
                amount: amount,
                date: new Date()
            });
        }

        await group.save();

        // Return updated settlement data
        const updatedSettlements = await getGroupSettlements({ groupId, user_id });

        return {
            message: `Successfully processed ${settlements.length} settlement(s)`,
            settlements: settlementResults,
            totalSettlements: settlements.length,
            updatedData: updatedSettlements
        };

    } catch (error: any) {
        console.error('Error in settleMultipleDebts:', error.message);
        throw new Error(`Failed to settle multiple debts: ${error.message}`);
    }
};

// Get comprehensive group transactions with filtering and user-specific data
const getGroupTransactions = async ({
    groupId,
    user_id,
    filters
}: {
    groupId: string,
    user_id: mongoose.Types.ObjectId | null,
    filters?: {
        expenseView?: 'all' | 'involving_me_only',
        transactionType?: 'i_borrowed' | 'i_lent' | 'all',
        search?: string
    }
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group with populated category data
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) })
            .populate('groupExpenses.category', 'name')
            .lean();

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to view this group');
        }

        // Calculate user-specific summary
        const balances = await calculateGroupBalances(groupId);
        const userBalance = balances[userEmail] || { paid: 0, owes: 0, net: 0 };

        const youllPay = userBalance.net < 0 ? Math.abs(userBalance.net) : 0;
        const youllCollect = userBalance.net > 0 ? userBalance.net : 0;

        // Process expenses with user-specific data
        let expenses = group.groupExpenses || [];

        // Apply search filter
        if (filters?.search) {
            const searchTerm = filters.search.toLowerCase();
            expenses = expenses.filter(expense => {
                const categoryName = (expense.category as any)?.name?.toLowerCase() || '';
                const note = expense.note?.toLowerCase() || '';
                return categoryName.includes(searchTerm) || note.includes(searchTerm);
            });
        }

        // Process each expense to add user-specific data
        const processedExpenses = expenses.map(expense => {
            // Calculate user's involvement in this expense
            let userPaid = 0;
            let userOwes = 0;

            // Check if user paid
            if (expense.paidBy.type === 'individual' && expense.paidBy.memberEmail === userEmail) {
                userPaid = expense.paidBy.amount;
            } else if (expense.paidBy.type === 'multiple') {
                const userPayment = expense.paidBy.payments?.find(p => p.memberEmail === userEmail);
                userPaid = userPayment?.amount || 0;
            }

            // Check how much user owes
            if (expense.shareWith.type === 'equal' && expense.shareWith.members.includes(userEmail)) {
                userOwes = expense.totalExpenseAmount / expense.shareWith.members.length;
            } else if (expense.shareWith.type === 'custom') {
                const userShare = expense.shareWith.shares?.find(s => s.memberEmail === userEmail);
                userOwes = userShare?.amount || 0;
            }

            const userNet = userPaid - userOwes;

            return {
                _id: (expense as any)._id,
                expenseDate: expense.expenseDate,
                totalExpenseAmount: expense.totalExpenseAmount,
                currency: expense.currency,
                category: expense.category,
                note: expense.note,
                paidBy: expense.paidBy,
                shareWith: expense.shareWith,
                userInvolvement: {
                    paid: userPaid,
                    owes: userOwes,
                    net: userNet,
                    status: userNet > 0 ? 'you_lent' : userNet < 0 ? 'you_borrowed' : 'settled',
                    amount: Math.abs(userNet)
                }
            };
        });

        // Apply expense view filter
        let filteredExpenses = processedExpenses;
        if (filters?.expenseView === 'involving_me_only') {
            filteredExpenses = processedExpenses.filter(expense =>
                expense.userInvolvement.paid > 0 || expense.userInvolvement.owes > 0
            );
        }

        // Apply transaction type filter
        if (filters?.transactionType && filters.transactionType !== 'all') {
            if (filters.transactionType === 'i_borrowed') {
                filteredExpenses = filteredExpenses.filter(expense => expense.userInvolvement.status === 'you_borrowed');
            } else if (filters.transactionType === 'i_lent') {
                filteredExpenses = filteredExpenses.filter(expense => expense.userInvolvement.status === 'you_lent');
            }
        }

        // Group expenses by category and date
        const expensesByCategory: { [key: string]: any[] } = {};
        const expensesByDate: { [key: string]: any[] } = {};

        filteredExpenses.forEach(expense => {
            const categoryName = (expense.category as any)?.name || 'Unknown';
            const dateKey = new Date(expense.expenseDate).toISOString().split('T')[0];

            if (!expensesByCategory[categoryName]) {
                expensesByCategory[categoryName] = [];
            }
            if (!expensesByDate[dateKey]) {
                expensesByDate[dateKey] = [];
            }

            expensesByCategory[categoryName].push(expense);
            expensesByDate[dateKey].push(expense);
        });

        // Calculate totals
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.totalExpenseAmount, 0);
        const totalUserBorrowed = filteredExpenses
            .filter(exp => exp.userInvolvement.status === 'you_borrowed')
            .reduce((sum, exp) => sum + exp.userInvolvement.amount, 0);
        const totalUserLent = filteredExpenses
            .filter(exp => exp.userInvolvement.status === 'you_lent')
            .reduce((sum, exp) => sum + exp.userInvolvement.amount, 0);

        return {
            group: {
                groupId: group.groupId,
                groupName: group.groupName,
                ownerEmail: group.ownerEmail,
                groupMembers: group.groupMembers || [],
                totalMembers: (group.groupMembers?.length || 0) + 1
            },
            summary: {
                youllPay: {
                    currency: 'USD', // You can make this dynamic based on group expenses
                    amount: youllPay
                },
                youllCollect: {
                    currency: 'USD',
                    amount: youllCollect
                },
                totalExpenses,
                totalUserBorrowed,
                totalUserLent
            },
            expenses: {
                list: filteredExpenses,
                byCategory: expensesByCategory,
                byDate: expensesByDate,
                count: filteredExpenses.length
            },
            filters: filters || {},
            balances: balances
        };

    } catch (error: any) {
        console.error('Error in getGroupTransactions service:', error.message);
        throw new Error(`Failed to get group transactions: ${error.message}`);
    }
};

// Delete group with debt settlement validation
const deleteGroup = async (groupId: string, userEmail: string) => {
    try {
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Check if user is the owner
        if (group.ownerEmail !== userEmail) {
            throw new Error('Only the group owner can delete the group');
        }

        // Check if group has any expenses
        if (group.groupExpenses && group.groupExpenses.length > 0) {
            // Calculate current balances to check if all debts are settled
            const balances = await calculateGroupBalances(groupId);

            // Check if any member has outstanding debt (net balance is not 0)
            const unsettledMembers = Object.entries(balances).filter(([_, balance]) => {
                return Math.abs(balance.net) > 0.01; // Allow for small rounding differences
            });

            if (unsettledMembers.length > 0) {
                const debtDetails = unsettledMembers.map(([email, balance]) => ({
                    memberEmail: email,
                    amount: balance.net,
                    status: balance.net > 0 ? 'is_owed' : 'owes'
                }));

                throw new Error(`Cannot delete group. Outstanding debts found. All debts must be settled before deletion. Unsettled members: ${debtDetails.map(d => `${d.memberEmail} ${d.status} ${Math.abs(d.amount)}`).join(', ')}`);
            }
        }

        // All conditions met, proceed with deletion
        const deletedGroup = await GroupTransactionModel.findOneAndDelete({ groupId: parseInt(groupId) });

        if (!deletedGroup) {
            throw new Error('Failed to delete group');
        }

        return {
            message: 'Group deleted successfully',
            deletedGroup: {
                groupId: deletedGroup.groupId,
                groupName: deletedGroup.groupName,
                memberCount: (deletedGroup.groupMembers?.length || 0) + 1,
                expenseCount: deletedGroup.groupExpenses?.length || 0
            }
        };

    } catch (error: any) {
        console.error('Error in deleteGroup service:', error.message);
        throw new Error(`Failed to delete group: ${error.message}`);
    }
};

// Remove member from group with debt settlement validation
const removeMemberFromGroup = async (groupId: string, memberEmail: string, requestingUserEmail: string) => {
    try {
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Check if requesting user has permission (owner or the member themselves)
        const isOwner = group.ownerEmail === requestingUserEmail;
        const isSelfLeaving = memberEmail === requestingUserEmail;

        if (!isOwner && !isSelfLeaving) {
            throw new Error('You can only remove yourself or, if you are the owner, remove other members');
        }

        // Check if member exists in the group
        const isMemberInGroup = group.groupMembers?.includes(memberEmail);
        const isOwnerLeaving = group.ownerEmail === memberEmail;

        if (!isMemberInGroup && !isOwnerLeaving) {
            throw new Error('Member is not part of this group');
        }

        // Owner cannot leave the group unless they are the only member
        if (isOwnerLeaving && group.groupMembers && group.groupMembers.length > 0) {
            throw new Error('Group owner cannot leave while there are other members. Transfer ownership or remove all members first');
        }

        // Check if group has expenses and validate debts/involvement
        if (group.groupExpenses && group.groupExpenses.length > 0) {
            // Calculate current balances
            const balances = await calculateGroupBalances(groupId);
            const memberBalance = balances[memberEmail];

            if (memberBalance) {
                // Check if member has unsettled debt
                if (Math.abs(memberBalance.net) > 0.01) {
                    throw new Error(`Cannot remove member. ${memberEmail} has unsettled debt of ${memberBalance.net > 0 ? 'is owed' : 'owes'} ${Math.abs(memberBalance.net)}. All debts must be settled before removal`);
                }
            }

            // Check if member is involved in any expenses (as payer or part of sharing)
            const isInvolvedInExpenses = group.groupExpenses.some(expense => {
                // Check if member paid for any expense
                const isPayer = expense.paidBy.type === 'individual'
                    ? expense.paidBy.memberEmail === memberEmail
                    : expense.paidBy.payments?.some(payment => payment.memberEmail === memberEmail);

                // Check if member is part of any expense sharing
                const isPartOfSharing = expense.shareWith.type === 'equal'
                    ? expense.shareWith.members.includes(memberEmail)
                    : expense.shareWith.shares?.some(share => share.memberEmail === memberEmail);

                return isPayer || isPartOfSharing;
            });

            if (isInvolvedInExpenses) {
                throw new Error(`Cannot remove member. ${memberEmail} is still part of shared expenses. All shared expenses involving this member must be resolved first`);
            }
        }

        // All validations passed, proceed with removal
        let updatedGroup;

        if (isOwnerLeaving) {
            // If owner is leaving and no other members, delete the group
            updatedGroup = await GroupTransactionModel.findOneAndDelete({ groupId: parseInt(groupId) });
            return {
                message: 'Owner left the group. Group has been deleted as it had no other members',
                action: 'group_deleted',
                groupDeleted: true,
                removedMember: memberEmail
            };
        } else {
            // Remove member from groupMembers array
            updatedGroup = await GroupTransactionModel.findOneAndUpdate(
                { groupId: parseInt(groupId) },
                { $pull: { groupMembers: memberEmail } },
                { new: true }
            );
        }

        if (!updatedGroup) {
            throw new Error('Failed to remove member from group');
        }

        return {
            message: `${isSelfLeaving ? 'You have' : 'Member has been'} successfully ${isSelfLeaving ? 'left' : 'removed from'} the group`,
            action: 'member_removed',
            groupDeleted: false,
            removedMember: memberEmail,
            group: {
                groupId: updatedGroup.groupId,
                groupName: updatedGroup.groupName,
                remainingMembers: (updatedGroup.groupMembers?.length || 0) + 1 // +1 for owner
            }
        };

    } catch (error: any) {
        console.error('Error in removeMemberFromGroup service:', error.message);
        throw new Error(`Failed to remove member: ${error.message}`);
    }
};

// Update group name
const updateGroupName = async (groupId: string, newGroupName: string, userEmail: string) => {
    try {
        // Validate input
        if (!newGroupName || newGroupName.trim().length === 0) {
            throw new Error('Group name is required and cannot be empty');
        }

        if (newGroupName.trim().length > 100) {
            throw new Error('Group name cannot exceed 100 characters');
        }

        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) });

        if (!group) {
            throw new Error('Group not found');
        }

        // Check if user is the owner (only owner can update group name)
        if (group.ownerEmail !== userEmail) {
            throw new Error('Only the group owner can update the group name');
        }

        // Check if the new name is different from current name
        if (group.groupName.trim() === newGroupName.trim()) {
            throw new Error('New group name must be different from the current name');
        }

        // Update the group name
        const updatedGroup = await GroupTransactionModel.findOneAndUpdate(
            { groupId: parseInt(groupId) },
            { $set: { groupName: newGroupName.trim() } },
            { new: true }
        );

        if (!updatedGroup) {
            throw new Error('Failed to update group name');
        }

        return {
            message: 'Group name updated successfully',
            group: {
                groupId: updatedGroup.groupId,
                groupName: updatedGroup.groupName,
                ownerEmail: updatedGroup.ownerEmail,
                memberCount: (updatedGroup.groupMembers?.length || 0) + 1,
                expenseCount: updatedGroup.groupExpenses?.length || 0
            }
        };

    } catch (error: any) {
        console.error('Error in updateGroupName service:', error.message);
        throw new Error(`Failed to update group name: ${error.message}`);
    }
};

// Get group members by group ID
const getGroupMembers = async ({
    groupId,
    user_id
}: {
    groupId: string,
    user_id: mongoose.Types.ObjectId | null
}) => {
    try {
        // Get user email
        const userEmail = await UserModel.findById(user_id).select('email').lean().then(user => user?.email || null);

        if (!userEmail) {
            throw new Error('User email not found');
        }

        // Find the group
        const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) }).lean();

        if (!group) {
            throw new Error('Group not found');
        }

        // Verify user is member or owner
        const isOwner = group.ownerEmail === userEmail;
        const isMember = group.groupMembers?.includes(userEmail);

        if (!isOwner && !isMember) {
            throw new Error('You are not authorized to view group members');
        }

        // Prepare member list
        const members = [];

        // Add owner as first member
        if (group.ownerEmail) {
            members.push({
                email: group.ownerEmail,
                isOwner: true
            });
        }

        // Add other members
        if (group.groupMembers && group.groupMembers.length > 0) {
            for (const memberEmail of group.groupMembers) {
                members.push({
                    email: memberEmail,
                    isOwner: false
                });
            }
        }

        return {
            groupId: group.groupId,
            groupName: group.groupName,
            owner: {
                email: group.ownerEmail,
                isOwner: true
            },
            members: members,
            totalMembers: members.length
        };

    } catch (error: any) {
        console.error('Error in getGroupMembers service:', error.message);
        throw new Error(`Failed to get group members: ${error.message}`);
    }
};

const groupTransactionServices = {
    createGroupTransaction,
    addGroupMember,
    getGroups,
    getGroupsByUserId,
    addGroupExpense,
    getGroupTransactions,
    getGroupStatus,
    calculateGroupBalances,
    getGroupSummary,
    calculateOptimalSettlements,
    getGroupSettlements,
    settleDebt,
    settleMultipleDebts,
    deleteGroup,
    removeMemberFromGroup,
    updateGroupName,
    getGroupMembers
};

export default groupTransactionServices;