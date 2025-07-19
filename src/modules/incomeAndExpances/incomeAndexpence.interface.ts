import { Types } from "mongoose";


export type ExpenseGroup={
    user_id:Types.ObjectId;
    groupMemberList:[
        {
            email:string;
            existOnPlatform?:boolean;
            isInvitationEmailSent?:boolean;
            name?:string

        }
    ]
}

export type PersonalExpenseTypes={
    user_id:Types.ObjectId;
    expenseTypeList:[{
        img?: string;
        name: string;
    }]
}
export type PersonalIncomeTypes={
    user_id:Types.ObjectId;
    incomeTypeList:[{
        img?: string;
        name: string;
    }]
}

export type TExpense ={
    date: string;
    amount: number;
    description: string;
    type: string;
    user_id:Types.ObjectId,
    isGroupExpense: boolean;
    group_id?: Types.ObjectId;
    spender_id?: Types.ObjectId;
}

export type TIncome = {
    date: string;
    amount: number;
    note: string;
    incomeSource: string;
    user_id: Types.ObjectId;
    isGroupIncome: boolean;
    group_id?: Types.ObjectId;
}