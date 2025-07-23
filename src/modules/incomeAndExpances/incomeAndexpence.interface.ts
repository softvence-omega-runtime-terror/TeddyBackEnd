import { Types } from 'mongoose';

export type ExpenseOrIncomeGroup = {
  user_id: Types.ObjectId;
  groupType: 'expense' | 'income';
  groupMemberList: [
    {
      email: string;
      member_id?: Types.ObjectId; // Optional, can be used to link to UserCollection
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
  transactionType: 'expense';
  currency: string;
  date: string;
  amount: number;
  distribution_type: 'equal' | 'custom' | null;
  description?: string;
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId | null;
  spender_id_Or_Email: Types.ObjectId | string| null;
  earnedBy_id_Or_Email?: never;
  typeModel: 'PersonalExpenseTypes';
};

export type TIncome = {
  transactionType: 'income';
  currency: string;
  date: string;
  amount: number;
  distribution_type: 'equal' | 'custom' | null;
  description: string;
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId | null;
  spender_id_Or_Email?: never;
  earnedBy_id_Or_Email: Types.ObjectId | string| null ;
  typeModel: 'PersonalIncomeTypes';
};