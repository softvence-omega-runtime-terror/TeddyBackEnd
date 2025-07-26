import { Types } from 'mongoose';

export type TExpenseOrIncomeGroup = {
  user_id: Types.ObjectId;
  groupName: string;
  groupType: 'expense' | 'income';
  reDistributeAmount?: number; // Optional, default to 0
  groupMemberList: [
    {
      email: string;
      member_id?: Types.ObjectId; // Optional, can be used to link to UserCollection
      existOnPlatform?: boolean;
      isInvitationEmailSent?: boolean;
      name?: string;
      isDeleted?: boolean; // Optional, to mark if the member is deleted
    }
  ];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TPersonalExpenseTypes = {
  user_id: Types.ObjectId;
  expenseTypeList: [
    {
      img?: string;
      name: string;
    }
  ];
};

export type TPersonalIncomeTypes = {
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
  typeModel: 'TPersonalExpenseTypes';
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
  typeModel: 'TPersonalIncomeTypes';
};