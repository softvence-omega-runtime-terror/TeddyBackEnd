import { Request, Response } from "express";
import catchAsync from "../../util/catchAsync";
import idConverter from "../../util/idConverter";
import groupTransactionServices from "./groupTransection.service";
import { UserModel } from "../user/user.model";
import { GroupTransactionModel } from "./groupTransection.model";
import { convertCurrency } from "../../util/currencyConverter";
import sendResponse from "../../util/sendResponse";


const createGroupTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupName } = req.body;

    const newGroup = await groupTransactionServices.createGroupTransaction({ groupName, user_id });

    res.status(200).json({
        status: 'success',
        data: newGroup,
        message: 'Group created successfully',
    });
});

const addGroupMember = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;
    const { members } = req.body;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Members array is required and cannot be empty',
        });
    }

    const updatedGroup = await groupTransactionServices.addGroupMember({ groupId, members, user_id });

    res.status(200).json({
        status: 'success',
        data: updatedGroup,
        message: 'Group member added successfully',
    });
});


const getGroups = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;
    const userCurrency = req.userPreferences?.currency || 'USD';

    const groups = await groupTransactionServices.getGroups({ user_id });
    let currencyConverted = false;

    // Convert currency for all financial data if needed
    if (groups && groups.groups && Array.isArray(groups.groups)) {
        for (const group of groups.groups) {
            if (group.financialSummary) {
                const { financialSummary } = group;

                // Convert youllPay amounts
                if (financialSummary.youllPay && Array.isArray(financialSummary.youllPay)) {
                    for (const payment of financialSummary.youllPay) {
                        if (payment.currency && payment.currency !== userCurrency) {
                            payment.amount = await convertCurrency(
                                payment.amount,
                                payment.currency as any,
                                userCurrency as any
                            );
                            payment.currency = userCurrency;
                            currencyConverted = true;
                        }
                    }
                }

                // Convert youllCollect amounts
                if (financialSummary.youllCollect && Array.isArray(financialSummary.youllCollect)) {
                    for (const collection of financialSummary.youllCollect) {
                        if (collection.currency && collection.currency !== userCurrency) {
                            collection.amount = await convertCurrency(
                                collection.amount,
                                collection.currency as any,
                                userCurrency as any
                            );
                            collection.currency = userCurrency;
                            currencyConverted = true;
                        }
                    }
                }

                // Convert total amounts
                if (financialSummary.totalYoullPay && financialSummary.totalYoullPay.currency !== userCurrency) {
                    financialSummary.totalYoullPay.amount = await convertCurrency(
                        financialSummary.totalYoullPay.amount,
                        financialSummary.totalYoullPay.currency as any,
                        userCurrency as any
                    );
                    financialSummary.totalYoullPay.currency = userCurrency;
                    currencyConverted = true;
                }

                if (financialSummary.totalYoullCollect && financialSummary.totalYoullCollect.currency !== userCurrency) {
                    financialSummary.totalYoullCollect.amount = await convertCurrency(
                        financialSummary.totalYoullCollect.amount,
                        financialSummary.totalYoullCollect.currency as any,
                        userCurrency as any
                    );
                    financialSummary.totalYoullCollect.currency = userCurrency;
                    currencyConverted = true;
                }

                if (financialSummary.netBalance && financialSummary.netBalance.currency !== userCurrency) {
                    financialSummary.netBalance.amount = await convertCurrency(
                        financialSummary.netBalance.amount,
                        financialSummary.netBalance.currency as any,
                        userCurrency as any
                    );
                    financialSummary.netBalance.currency = userCurrency;
                    currencyConverted = true;
                }
            }

            // Convert group stats if needed
            if (group.groupStats && group.groupStats.totalExpenses) {
                // Assuming group stats are in USD by default
                if (userCurrency !== 'USD') {
                    group.groupStats.totalExpenses = await convertCurrency(
                        group.groupStats.totalExpenses,
                        'USD',
                        userCurrency as any
                    );
                    currencyConverted = true;
                }
            }
        }
    }

    // Prepare response with currency conversion note if applicable
    const response: any = {
        status: 'success',
        data: groups,
        message: 'Groups retrieved successfully',
    };

    // Add currency conversion note if conversion happened
    if (currencyConverted) {
        response.currencyNote = `Amounts converted to ${userCurrency}`;
    }

    res.status(200).json(response);
});

const getGroupsByUserId = catchAsync(async (req: Request, res: Response) => {

    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({
            status: 'fail',
            message: 'User ID is required'
        })
    }

    const id = idConverter(userId);

    const groups = await groupTransactionServices.getGroupsByUserId({ userId: id });
    res.status(200).json({
        status: 'success',
        data: groups,
        message: 'Groups retrieved successfully',
    })

})


const addGroupExpense = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;


    const { groupId } = req.params;
    const { ...expenseData } = req.body;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!expenseData) {
        return res.status(400).json({
            status: 'fail',
            message: 'Expense data is required',
        });
    }

    const updatedGroup = await groupTransactionServices.addGroupExpense({ groupId, expenseData, user_id });

    res.status(200).json({
        status: 'success',
        data: updatedGroup,
        message: 'Group expense added successfully',
    });
});

const updateGroupExpense = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId, expenseId } = req.params;
    const { ...expenseData } = req.body;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!expenseId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Expense ID is required',
        });
    }

    if (!expenseData || Object.keys(expenseData).length === 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Expense data is required for update',
        });
    }

    const updatedGroup = await groupTransactionServices.updateGroupExpense({ groupId, expenseId, expenseData, user_id });

    res.status(200).json({
        status: 'success',
        data: updatedGroup,
        message: 'Group expense updated successfully',
    });
});

const deleteGroupExpense = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId, expenseId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!expenseId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Expense ID is required',
        });
    }

    const updatedGroup = await groupTransactionServices.deleteGroupExpense({ groupId, expenseId, user_id });

    res.status(200).json({
        status: 'success',
        data: updatedGroup,
        message: 'Group expense deleted successfully',
    });
});

const getGroupTransactions = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;
    const { expenseView, transactionType, search } = req.query;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    // Prepare filters
    const filters: any = {};
    if (expenseView && (expenseView === 'all' || expenseView === 'involving_me_only')) {
        filters.expenseView = expenseView;
    }
    if (transactionType && ['i_borrowed', 'i_lent', 'all'].includes(transactionType as string)) {
        filters.transactionType = transactionType;
    }
    if (search && typeof search === 'string') {
        filters.search = search.trim();
    }

    const groupData = await groupTransactionServices.getGroupTransactions({
        groupId,
        user_id,
        filters
    });

    res.status(200).json({
        status: 'success',
        data: groupData,
        message: 'Group transactions retrieved successfully',
    });
});

const getGroupStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;
    const { expenseView, transactionType, search } = req.query;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    // Prepare filters
    const filters: any = {};
    if (expenseView && (expenseView === 'all' || expenseView === 'involving_me_only')) {
        filters.expenseView = expenseView;
    }
    if (transactionType && ['i_borrowed', 'i_lent', 'all'].includes(transactionType as string)) {
        filters.transactionType = transactionType;
    }
    if (search && typeof search === 'string') {
        filters.search = search.trim();
    }

    const groupStatus = await groupTransactionServices.getGroupStatus({
        groupId,
        user_id,
        filters
    });

    res.status(200).json({
        status: 'success',
        data: groupStatus,
        message: 'Group status retrieved successfully',
    });
});

const getGroupDetails = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!user_id) {
        return res.status(401).json({
            status: 'fail',
            message: 'User authentication required',
        });
    }

    // Check if user is authorized to view group details
    const userEmail = await UserModel.findById(user_id).select('email').lean().then((user: any) => user?.email || null);

    if (!userEmail) {
        return res.status(404).json({
            status: 'fail',
            message: 'User not found',
        });
    }

    // Find the group to check membership
    const group = await GroupTransactionModel.findOne({ groupId: parseInt(groupId) }).lean();

    if (!group) {
        return res.status(404).json({
            status: 'fail',
            message: 'Group not found',
        });
    }

    // Verify user is owner or member
    const isOwner = group.ownerEmail === userEmail;
    const isMember = group.groupMembers?.includes(userEmail);

    if (!isOwner && !isMember) {
        return res.status(403).json({
            status: 'fail',
            message: 'You are not authorized to view this group details',
        });
    }

    const groupDetails = await groupTransactionServices.getGroupSummary(groupId);

    res.status(200).json({
        status: 'success',
        data: groupDetails,
        message: 'Group details retrieved successfully',
    });
});

const getGroupMembers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!user_id) {
        return res.status(401).json({
            status: 'fail',
            message: 'User authentication required',
        });
    }

    const groupMembers = await groupTransactionServices.getGroupMembers({ groupId, user_id });

    res.status(200).json({
        status: 'success',
        data: groupMembers,
        message: 'Group members retrieved successfully',
    });
});

const deleteGroup = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!user_id) {
        return res.status(401).json({
            status: 'fail',
            message: 'User authentication required',
        });
    }

    // Get user email for authorization
    const userEmail = await UserModel.findById(user_id).select('email').lean().then((user: any) => user?.email || null);

    if (!userEmail) {
        return res.status(404).json({
            status: 'fail',
            message: 'User not found',
        });
    }

    const result = await groupTransactionServices.deleteGroup(groupId, userEmail);

    res.status(200).json({
        status: 'success',
        data: result,
        message: 'Group deleted successfully',
    });
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId, memberEmail } = req.params;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!memberEmail) {
        return res.status(400).json({
            status: 'fail',
            message: 'Member email is required',
        });
    }

    if (!user_id) {
        return res.status(401).json({
            status: 'fail',
            message: 'User authentication required',
        });
    }

    // Get requesting user's email for authorization
    const requestingUserEmail = await UserModel.findById(user_id).select('email').lean().then((user: any) => user?.email || null);

    if (!requestingUserEmail) {
        return res.status(404).json({
            status: 'fail',
            message: 'User not found',
        });
    }

    const result = await groupTransactionServices.removeMemberFromGroup(groupId, memberEmail, requestingUserEmail);

    res.status(200).json({
        status: 'success',
        data: result,
        message: result.message,
    });
});

const updateGroupName = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupId } = req.params;
    const { groupName } = req.body;

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    if (!groupName) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group name is required',
        });
    }

    if (!user_id) {
        return res.status(401).json({
            status: 'fail',
            message: 'User authentication required',
        });
    }

    // Get requesting user's email for authorization
    const userEmail = await UserModel.findById(user_id).select('email').lean().then((user: any) => user?.email || null);

    if (!userEmail) {
        return res.status(404).json({
            status: 'fail',
            message: 'User not found',
        });
    }

    const result = await groupTransactionServices.updateGroupName(groupId, groupName, userEmail);

    res.status(200).json({
        status: 'success',
        data: result,
        message: 'Group name updated successfully',
    });
});


// Get group settlements for "Slice up" feature
const getGroupSettlements = catchAsync(async (req: any, res: Response) => {
    const { groupId } = req.params;
    const user_id = req?.user?.id ?? null;

    if (!groupId) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Group ID is required',
            data: null
        });
    }

    const settlements = await groupTransactionServices.getGroupSettlements({
        groupId,
        user_id
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Group settlements retrieved successfully',
        data: settlements
    });
});

// Settle debt between group members
const settleGroupDebt = catchAsync(async (req: any, res: Response) => {
    const { groupId } = req.params;
    const { fromEmail, toEmail, amount } = req.body;
    const user_id = req?.user?.id ?? null;

    if (!groupId || !fromEmail || !toEmail || !amount) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Group ID, fromEmail, toEmail, and amount are required',
            data: null
        });
    }

    if (amount <= 0) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Settlement amount must be greater than 0',
            data: null
        });
    }

    if (fromEmail === toEmail) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Cannot settle debt with yourself',
            data: null
        });
    }

    const result = await groupTransactionServices.settleDebt({
        groupId,
        fromEmail,
        toEmail,
        amount,
        user_id
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: result
    });
});

// Settle multiple debts between group members
const settleMultipleGroupDebts = catchAsync(async (req: any, res: Response) => {
    const { groupId } = req.params;
    const { settlements } = req.body;
    const user_id = req?.user?.id ?? null;

    if (!groupId) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Group ID is required',
            data: null
        });
    }

    if (!settlements || !Array.isArray(settlements) || settlements.length === 0) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: 'Settlements array is required and must contain at least one settlement',
            data: null
        });
    }

    // Validate each settlement
    for (let i = 0; i < settlements.length; i++) {
        const settlement = settlements[i];
        if (!settlement.fromEmail || !settlement.toEmail || !settlement.amount) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `Settlement ${i + 1}: fromEmail, toEmail, and amount are required`,
                data: null
            });
        }

        if (settlement.amount <= 0) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `Settlement ${i + 1}: amount must be greater than 0`,
                data: null
            });
        }

        if (settlement.fromEmail === settlement.toEmail) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: `Settlement ${i + 1}: cannot settle debt with yourself`,
                data: null
            });
        }
    }

    const result = await groupTransactionServices.settleMultipleDebts({
        groupId,
        settlements,
        user_id
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: result
    });
});

const groupTransactionController = {
    createGroupTransaction,
    addGroupMember,
    getGroups,
    getGroupsByUserId,
    addGroupExpense,
    updateGroupExpense,
    deleteGroupExpense,
    getGroupTransactions,
    getGroupStatus,
    getGroupDetails,
    getGroupMembers,
    getGroupSettlements,
    settleGroupDebt,
    settleMultipleGroupDebts,
    deleteGroup,
    removeMember,
    updateGroupName
};

export default groupTransactionController;