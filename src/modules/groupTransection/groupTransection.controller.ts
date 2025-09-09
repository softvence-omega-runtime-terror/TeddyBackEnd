import { Request, Response } from "express";
import catchAsync from "../../util/catchAsync";
import idConverter from "../../util/idConverter";
import groupTransactionServices from "./groupTransection.service";
import { UserModel } from "../user/user.model";
import { GroupTransactionModel } from "./groupTransection.model";


const createGroupTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user_id = userId ? idConverter(userId) : null;

    const { groupName } = req.body;

    const newGroup = await groupTransactionServices.createGroupTransaction({ groupName, user_id });

    res.status(200).json({
        status: 'success',
        data: newGroup,
        message: 'New Group created successfully',
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

    const groups = await groupTransactionServices.getGroups({ user_id });

    res.status(200).json({
        status: 'success',
        data: groups,
        message: 'Groups retrieved successfully',
    });
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



const groupTransactionController = {
    createGroupTransaction,
    addGroupMember,
    getGroups,
    addGroupExpense,
    getGroupTransactions,
    getGroupStatus,
    getGroupDetails
};

export default groupTransactionController;