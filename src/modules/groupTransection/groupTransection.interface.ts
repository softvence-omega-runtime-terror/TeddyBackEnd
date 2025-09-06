import { Types } from "mongoose";

// Define payment types
export type TPaidBy =
    | {
        type: 'individual';
        memberId: Types.ObjectId;
        amount: number;
    }
    | {
        type: 'multiple';
        payments: {
            memberId: Types.ObjectId;
            amount: number;
        }[];
    };

// Define share types
export type TShareWith =
    | {
        type: 'equal';
        members: Types.ObjectId[]; // List of members to share equally
    }
    | {
        type: 'custom';
        shares: {
            memberId: Types.ObjectId;
            amount: number;
        }[];
    };

// Define group structure
export type TGroupTransaction = {
    groupId?: number;
    ownerId?: Types.ObjectId;
    groupName: string;
    groupMembers?: Types.ObjectId[];
    groupExpenses?: [{
        expenseDate: Date;
        totalExpenseAmount: number;
        currency: 'USD' | 'EUR' | 'SGD' | 'GBP' | 'AUD';
        category: Types.ObjectId;
        note?: string;
        paidBy: TPaidBy;
        shareWith: TShareWith;
    }]
}