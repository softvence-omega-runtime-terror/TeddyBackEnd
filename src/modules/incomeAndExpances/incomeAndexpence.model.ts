import { Schema, model } from "mongoose";

// Expense Group Schema
const expenseGroupSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: true,
  },
  groupMemberList: {
    type: [{
      email: { type: String, required: true },
      existOnPlatform: { type: Boolean, required: false },
      isInvitationEmailSent: { type: Boolean, required: false },
      name: { type: String, required: false },
    }],
    required: true,
  },
});

// Personal Expense Types Schema
const personalExpenseTypesSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: false,
  },
  expenseTypeList: {
    type: [{
      img: { type: String, required: false },
      name: { type: String, required: true },
    }],
    required: false,
  },
});

// Personal Income Types Schema
const personalIncomeTypesSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: false,
  },
  incomeTypeList: {
    type: [{
      img: { type: String, required: false },
      name: { type: String, required: true },
    }],
    required: false,
  },
});

// Expense Schema
const expenseSchema = new Schema({
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
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: true,
  },
  isGroupExpense: {
    type: Boolean,
    required: true,
    default: false,
  },
  group_id: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: false,
  },
  spender_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: false,
  },
});

// Income Schema
const incomeSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
  incomeSource: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "UserCollection",
    required: true,
  },
  isGroupIncome: {
    type: Boolean,
    required: true,
  },
  group_id: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: false,
  },
});

// Create and export models
export const ExpenseGroupModel = model("ExpenseGroup", expenseGroupSchema);
export const ExpenseTypesModel = model("PersonalExpenseTypes", personalExpenseTypesSchema);
export const IncomeTypesModel = model("PersonalIncomeTypes", personalIncomeTypesSchema);
export const ExpenseModel = model("Expense", expenseSchema);
export const IncomeModel = model("Income", incomeSchema);