import { Schema, Types, model } from 'mongoose';
import { Document } from 'mongoose';
import { TExpenseOrIncomeGroup } from './incomeAndexpence.interface';

// Type for the Transaction document (union of TExpense and TIncome)
type TransactionDocument = Document & (
  | {
      transactionType: 'expense';
      transaction_Code: string;
      currency: string;
      date: string;
      amount: number;
      shareWith: "all" | "custom" | "none";
      perticipated_members?: [string];
      slice_type: 'equal' | 'custom' | null;
      members_Share_list?: {
        member_email: Types.ObjectId;
        share_amount: number;
      }[];
      contribution_type?: "allClear" | "custom";
      contribution_list?: [{
        member_email: Types.ObjectId;
        contributed_amount: number;
      }];
      inDebt?: boolean;
      borrowedOrLendAmount?: number;
      description?: string;
      type_id: Types.ObjectId;
      user_id: Types.ObjectId;
      isGroupTransaction: boolean;
      group_id?: Types.ObjectId | null;
      spender_id_Or_Email: Types.ObjectId | string | null;
      earnedBy_id_Or_Email?: never;
      typeModel: 'TPersonalExpenseTypes';
    }
  | {
      transactionType: 'income';
      transaction_Code: string;
      currency: string;
      date: string;
      amount: number;
      shareWith: "all" | "custom" | "none";
      perticipated_members?: [string];
      slice_type: 'equal' | 'custom' | null;
      members_Share_list?: {
        member_email: Types.ObjectId;
        share_amount: number;
      }[];
      contribution_type?: "allClear" | "custom";
      contribution_list?: [{
        member_email: Types.ObjectId;
        contributed_amount: number;
      }];
      inDebt?: boolean;
      borrowedOrLendAmount?: number;
      description?: string;
      type_id: Types.ObjectId;
      user_id: Types.ObjectId;
      isGroupTransaction: boolean;
      group_id?: Types.ObjectId | null;
      spender_id_Or_Email?: never;
      earnedBy_id_Or_Email: Types.ObjectId | string | null;
      typeModel: 'TPersonalIncomeTypes';
    }
);

// Expense Group Schema
const expenseOrIncomeGroup = new Schema<TExpenseOrIncomeGroup>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    groupType: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
    },
    reDistributeAmount: { type: Number, required: false, default: 0 },
    redistributeTransactionCode: { type: String, required: false, default: null },
    groupMemberList: {
      type: [
        {
          email: { type: String, required: true },
          member_id: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: false },
          existOnPlatform: { type: Boolean, required: false, default: false },
          isInvitationEmailSent: { type: Boolean, required: false, default: false },
          name: { type: String, required: false },
          isDeleted: { type: Boolean, required: false, default: false },
        },
      ],
      required: true,
      default: [],
    },
    isDeleted: { type: Boolean, required: false, default: false },
  },
  { timestamps: true }
);

// Personal Expense Types Schema
const personalExpenseTypesSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: true,
    },
    expenseTypeList: {
      type: [
        {
          img: { type: String, required: false },
          name: { type: String, required: true },
        },
      ],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

// Personal Income Types Schema
const personalIncomeTypesSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: true,
    },
    incomeTypeList: {
      type: [
        {
          img: { type: String, required: false },
          name: { type: String, required: true },
        },
      ],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

// Common Transaction Schema for Expenses and Incomes
const transactionSchema = new Schema<TransactionDocument>(
  {
    transactionType: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
    },
    transaction_Code: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    shareWith: {
      type: String,
      enum: ['all', 'custom', 'none'],
      required: true,
    },
    perticipated_members: {
      type: [String],
      required: false,
    },
    slice_type: {
      type: String,
      enum: ['equal', 'custom', null],
      required: false,
    },
    members_Share_list: {
      type: [
        {
          member_email: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
          share_amount: { type: Number, required: true },
        },
      ],
      required: false,
    },
    contribution_type: {
      type: String,
      enum: ['allClear', 'custom'],
      required: false,
    },
    contribution_list: {
      type: [
        {
          member_email: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
          contributed_amount: { type: Number, required: true },
        },
      ],
      required: false,
    },
    inDebt: {
      type: Boolean,
      required: false,
      default: false,
    },
    borrowedOrLendAmount: {
      type: Number,
      required: false,
    },
    description: {
      type: String,
      required: function (this: TransactionDocument) {
        return this.transactionType === 'income';
      },
    },
    type_id: {
      type: Schema.Types.ObjectId,
      refPath: 'typeModel',
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: true,
    },
    isGroupTransaction: {
      type: Boolean,
      required: true,
      default: false,
    },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseGroupOrIncomeGroup',
      required: function (this: TransactionDocument) {
        return this.isGroupTransaction === true;
      },
    },
    spender_id_Or_Email: {
      type: Schema.Types.Mixed,
      required: function (this: TransactionDocument) {
        return this.transactionType === 'expense';
      },
    },
    earnedBy_id_Or_Email: {
      type: Schema.Types.Mixed,
      required: function (this: TransactionDocument) {
        return this.transactionType === 'income';
      },
    },
    typeModel: {
      type: String,
      enum: ['TPersonalExpenseTypes', 'TPersonalIncomeTypes'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to set typeModel based on transactionType
transactionSchema.pre('save', function (next) {
  if (this.transactionType === 'expense') {
    this.typeModel = 'TPersonalExpenseTypes';
  } else if (this.transactionType === 'income') {
    this.typeModel = 'TPersonalIncomeTypes';
  }
  next();
});

// Create and export models
export const ExpenseOrIncomeGroupModel = model('ExpenseGroupOrIncomeGroup', expenseOrIncomeGroup);
export const ExpenseTypesModel = model('TPersonalExpenseTypes', personalExpenseTypesSchema);
export const IncomeTypesModel = model('TPersonalIncomeTypes', personalIncomeTypesSchema);
export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);

// C7-07232025

// ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKrcGxEgsvHvsJoETpmrhVnXvoddDiJQIyfAJq0NFyJ8 habibrifatx21@gmail.com
