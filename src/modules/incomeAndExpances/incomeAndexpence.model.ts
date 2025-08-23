import { Schema, Types, model } from 'mongoose';
import { Document } from 'mongoose';
import { TExpenseOrIncomeGroup, TPersonalExpenseTypes, TPersonalIncomeTypes, TExpense, TIncome, GroupsEachTransactionSummary } from './incomeAndexpence.interface';

// Type for the Transaction document (union of TExpense and TIncome)
type TransactionDocument = Document & (TExpense | TIncome);

// Expense or Income Group Schema
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
    reDistributeAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    redistributeTransactionCode: {
      type: String,
      required: false,
      default: null,
    },
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
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

// Personal Expense Types Schema
const personalExpenseTypesSchema = new Schema<TPersonalExpenseTypes>(
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
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

// Personal Income Types Schema
const personalIncomeTypesSchema = new Schema<TPersonalIncomeTypes>(
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
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

// Groups Each Transaction Summary Schema
const groupsEachTransactionSummarySchema = new Schema<GroupsEachTransactionSummary>(
  {
    amount: {
      type: Number,
      required: true,
    },
   
    perticipated_members: {
      type: [String],
      required: true,
    },
    slice_type: {
      type: String,
      enum: ['equal', 'custom', null],
      required: false,
    },
    members_Share_list: {
      type: [
        {
          member_email: { type: Schema.Types.Mixed, required: true },
          share_amount: { type: Number, required: true },
        },
      ],
      required: true,
    },
    contribution_type: {
      type: String,
      enum: ['allClear', 'custom'],
      required: true,
    },
    contribution_list: {
      type: [
        {
          member_email: { type: Schema.Types.Mixed, required: true },
          contributed_amount: { type: Number, required: true },
        },
      ],
      required: true,
    },
    reDistributableAmount: {
      type: Number,
      required: true,
    },
    fractionalTransaction_id: {
      type: [Schema.Types.ObjectId],
      ref: 'Transaction',
      required: true,
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
      required: false,
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
export const ExpenseOrIncomeGroupModel = model<TExpenseOrIncomeGroup>('ExpenseGroupOrIncomeGroup', expenseOrIncomeGroup);
export const ExpenseTypesModel = model<TPersonalExpenseTypes>('TPersonalExpenseTypes', personalExpenseTypesSchema);
export const IncomeTypesModel = model<TPersonalIncomeTypes>('TPersonalIncomeTypes', personalIncomeTypesSchema);
export const GroupsEachTransactionSummaryModel = model<GroupsEachTransactionSummary>('GroupsEachTransactionSummary', groupsEachTransactionSummarySchema);
export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);