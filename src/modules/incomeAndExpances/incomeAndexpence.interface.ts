import { Types } from "mongoose";

export type ExpenseOrIncomeGroup = {
  user_id: Types.ObjectId;
  groupType: "expense" | "income";
  groupMemberList: [
    {
      email: string;
      existOnPlatform?: boolean;
      isInvitationEmailSent?: boolean;
      name?: string;
    }
  ];
};

export type PersonalExpenseTypes = {
  user_id: Types.ObjectId;
  expenseTypeList: [
    {
      img?: string;
      name: string;
    }
  ];
};

export type PersonalIncomeTypes = {
  user_id: Types.ObjectId;
  incomeTypeList: [
    {
      img?: string;
      name: string;
    }
  ];
};

export type TExpense = {
  transactionType: "expense";
  curacy:string;
  date: string;
  amount: number;
  distribution_type: "equal" | "custom";
  description?: string; // Optional for expenses
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId;
  spender_id: Types.ObjectId; // Required for expenses
  earnedBy_id?: never; // Explicitly excluded for expenses
};

export type TIncome = {
  transactionType: "income";
  curacy:string;
  date: string;
  amount: number;
  distribution_type: "equal" | "custom";
  description: string; // Required for incomes (replaces note)
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId;
  spender_id?: never; // Explicitly excluded for incomes
  earnedBy_id: Types.ObjectId; // Required for incomes
};