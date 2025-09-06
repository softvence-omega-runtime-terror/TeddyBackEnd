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

const groupTransactionController = {
    createGroupTransaction,
};

export default groupTransactionController;