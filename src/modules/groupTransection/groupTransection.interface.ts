import { Types } from "mongoose";

// Define payment types
export type TPaidBy =
    | {
        type: 'individual';
        memberEmail: string;
        amount: number;
    }
    | {
        type: 'multiple';
        payments: {
            memberEmail: string;
            amount: number;
        }[];
    };

// Define share types
export type TShareWith =
    | {
        type: 'equal';
        members: string[]; // List of member emails to share equally
    }
    | {
        type: 'custom';
        shares: {
            memberEmail: string;
            amount: number;
        }[];
    };

// Define group structure
export type TGroupTransaction = {
    groupId?: number;
    ownerId?: Types.ObjectId;
    ownerEmail?: string;
    groupName: string;
    groupMembers?: string[];
    groupExpenses?: {
        expenseDate: Date;
        totalExpenseAmount: number;
        currency: 'USD' | 'EUR' | 'SGD' | 'GBP' | 'AUD';
        category: Types.ObjectId;
        note?: string;
        paidBy: TPaidBy;
        shareWith: TShareWith;
    }[]
}