import { Types } from 'mongoose';

export type TExpenseOrIncomeGroup = {
  user_id: Types.ObjectId;
  groupName: string;
  groupType: 'expense' | 'income';
  reDistributeAmount?: number; // Optional, default to 0
  redistributeTransactionCode?: string | null // Optional, used for redistribution transactions
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
  isDeleted?: boolean; // Optional, to mark if the group is deleted 
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


export type GroupsEachTransactionSummary={
amount: number;
  shareWith: "all" | "custom" | "none"; // Indicates how the expense is shared
  perticipated_members: [string]; // List of member IDs who participated in the expense
  slice_type: 'equal' | 'custom' | null;
  members_Share_list: {
    member_email: Types.ObjectId | string;
    share_amount: number;
  }[];
  contribution_type: "allClear" | "custom"; // Optional, used for custom slice type
  contribution_list: [{
    member_email: Types.ObjectId | string;
    contributed_amount: number;
  }];
  reDistributableAmount:number
  fractionalTransaction_id:[Types.ObjectId]
}

export type TExpense = {
  transactionType: 'expense';
  transaction_Code: string;
  currency: string;
  date: string;
  amount: number;
  inDebt?: boolean; // Indicates if the user is in debt for this expense
  borrowedOrLendAmount?: number; // Amount of debt if applicable
  description?: string;
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId | null;
  spender_id_Or_Email: Types.ObjectId | string | null;
  earnedBy_id_Or_Email?: never;
  typeModel: 'TPersonalExpenseTypes';
};

export type TIncome = {
  transactionType: 'income';
  transaction_Code: string;
  currency: string;
  date: string;
  amount: number;
  inDebt?: boolean; // Indicates if the user is in debt for this income
  borrowedOrLendAmount?: number; // Amount of debt if applicable
  description?: string;
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId | null;
  spender_id_Or_Email?: never;
  earnedBy_id_Or_Email: Types.ObjectId | string | null;
  typeModel: 'TPersonalIncomeTypes';
};