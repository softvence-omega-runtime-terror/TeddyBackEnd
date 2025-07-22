import { Schema, Types, model, Document } from 'mongoose';

// Type for the Transaction document
type TransactionDocument = Document & {
  transactionType: 'expense' | 'income';
  curacy: string;
  date: string;
  amount: number;
  distribution_type: 'equal' | 'custom';
  description?: string;
  type_id: Types.ObjectId;
  user_id: Types.ObjectId;
  isGroupTransaction: boolean;
  group_id?: Types.ObjectId;
  spender_id?: Types.ObjectId;
  earnedBy_id?: Types.ObjectId;
};

// Expense Group Schema
const expenseGroupSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: true,
    },
    groupType: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
    },
    groupMemberList: {
      type: [
        {
          email: { type: String, required: true },
          existOnPlatform: { type: Boolean, required: false, default: false },
          isInvitationEmailSent: {
            type: Boolean,
            required: false,
            default: false,
          },
          name: { type: String, required: false },
        },
      ],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
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
  { timestamps: true },
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
  { timestamps: true },
);

// Common Transaction Schema for Expenses and Incomes
const transactionSchema = new Schema<TransactionDocument>(
  {
    transactionType: {
      type: String,
      enum: ['expense', 'income'],
      required: true,
    },
    curacy: { 
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    type_id: {
      type: Schema.Types.ObjectId,
      refPath: 'transactionType', // Dynamically reference PersonalExpenseTypes or PersonalIncomeTypes
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
      ref: 'ExpenseGroup',
      required: false,
    },
    distribution_type: {
      type: String,
      enum: ['equal', 'custom'],
      required: false,
    },



    spender_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: function (this: TransactionDocument) {
        return this.transactionType === 'expense'; // Required for expenses
      },
    },
    earnedBy_id: {
      type: Schema.Types.ObjectId,
      ref: 'UserCollection',
      required: function (this: TransactionDocument) {
        return this.transactionType === 'income'; // Required for incomes
      },
    },
  },
  { timestamps: true },
);

// Create and export models
export const ExpenseGroupModel = model('ExpenseGroup', expenseGroupSchema);
export const ExpenseTypesModel = model(
  'PersonalExpenseTypes',
  personalExpenseTypesSchema,
);
export const IncomeTypesModel = model(
  'PersonalIncomeTypes',
  personalIncomeTypesSchema,
);
export const ExpenseModel = model<TransactionDocument>(
  'Expense',
  transactionSchema,
);
export const IncomeModel = model<TransactionDocument>(
  'Income',
  transactionSchema,
);
