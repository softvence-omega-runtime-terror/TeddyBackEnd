import mongoose, { Schema } from "mongoose";
import { TGroupsEachTransactionSummary } from "./transection.interface";

const GroupsEachTransactionSummarySchema = new Schema<TGroupsEachTransactionSummary>(
  {
    amount: { type: Number, required: true },
    perticipated_members: { type: [String], required: true },
    slice_type: { type: String, enum: ['equal', 'custom', null], default: null },
    members_Share_list: [
      {
        member_email: { type: String, required: true },
        share_amount: { type: Number, required: true },
      },
    ],
    contribution_type: { type: String, enum: ['allClear', 'custom'], required: true },
    contribution_list: [
      {
        member_email: { type: String, required: true },
        contributed_amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);



export const GroupTransection = mongoose.model('GroupTransection', GroupsEachTransactionSummarySchema);
