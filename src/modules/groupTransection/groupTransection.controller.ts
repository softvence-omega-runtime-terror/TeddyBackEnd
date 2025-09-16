import { Request, Response } from "express";
import catchAsync from "../../util/catchAsync";
import idConverter from "../../util/idConverter";
import groupTransactionServices from "./groupTransection.service";
import { UserModel } from "../user/user.model";
import { GroupTransactionModel } from "./groupTransection.model";
import { convertCurrency } from "../../util/currencyConverter";


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

    if (!groupId) {
        return res.status(400).json({
            status: 'fail',
            message: 'Group ID is required',
        });
    }

    const groupStatus = await groupTransactionServices.getGroupStatus({
        groupId,
        user_id
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


const groupTransactionController = {
    createGroupTransaction,
    addGroupMember,
    getGroups,
    addGroupExpense,
    getGroupTransactions,
    getGroupStatus,
    getGroupDetails,
    deleteGroup,
    removeMember,
    updateGroupName
};

export default groupTransactionController;