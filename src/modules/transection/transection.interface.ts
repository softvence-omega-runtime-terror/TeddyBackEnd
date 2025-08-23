export type TGroupsEachTransactionSummary = {
  amount: number;

  // যারা transaction এ অংশগ্রহণ করেছে
  perticipated_members: string[];

  slice_type: 'equal' | 'custom' | null;

  // প্রতিটি member এর share
  members_Share_list: {
    member_email: string;
    share_amount: number;
  }[];

  contribution_type: 'allClear' | 'custom';

  // প্রতিটি member কত contribute করেছে
  contribution_list: {
    member_email: string;
    contributed_amount: number;
  }[];

  // Paybacks: কারা কার কাছে টাকা দিবে
  paybacks?: {
    from: string;
    to: string;
    amount: number;
  }[];
};
