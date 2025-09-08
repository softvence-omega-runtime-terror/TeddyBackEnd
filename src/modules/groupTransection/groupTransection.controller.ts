import { Request, Response } from "express";
import catchAsync from "../../util/catchAsync";
import idConverter from "../../util/idConverter";
import groupTransactionServices from "./groupTransection.service";


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

const groupTransactionController = {
    createGroupTransaction,
    addGroupMember,
    addGroupExpense
};

export default groupTransactionController;