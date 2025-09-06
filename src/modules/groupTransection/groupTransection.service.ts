import mongoose, { mongo } from "mongoose";
import { GroupTransactionModel } from "./groupTransection.model";

const createGroupTransaction = async ({ groupName, user_id }: { groupName: string, user_id: mongoose.Types.ObjectId | null }) => {
    try {

        const generatedGroupId = new mongoose.Types.ObjectId();
        const newGroup = new GroupTransactionModel({
            groupId: generatedGroupId.getTimestamp().getTime(),
            groupName,
            ownerId: user_id,
        });
        await newGroup.save();
        return newGroup;
    } catch (error: any) {
        console.error('Error in createGroupTransaction service:', error.message);
        throw new Error(`Failed to create group transaction: ${error.message}`);
    }
};

const groupTransactionServices = {
    createGroupTransaction,
};

export default groupTransactionServices;