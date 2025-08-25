import { Types } from 'mongoose';

export type TGroupsEachTransactionSummary = {
  amount: number;

  createdBy: Types.ObjectId;

  perticipated_members: string[];

  slice_type: 'equal' | 'custom' | null;

  members_Share_list: {
    member_email: string;
    share_amount: number;
  }[];

  contribution_type: 'allClear' | 'custom';

  contribution_list: {
    member_email: string;
    contributed_amount: number;
  }[];

  paybacks?: {
    from: string;
    to: string;
    amount: number;
  }[];
};
