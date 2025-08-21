import { GroupTransection } from "./transection.model";


interface CreateTransactionPayload {
  amount: number;
  perticipated_members: string[];
  slice_type: 'equal' | 'custom' | null;
  members_Share_list?: { member_email: string; share_amount: number }[];
  contribution_type: 'allClear' | 'custom';
  contribution_list?: { member_email: string; contributed_amount: number }[];
}

export const createTransactionSummary = async (payload: CreateTransactionPayload) => {
  const { amount, perticipated_members, slice_type, members_Share_list, contribution_type, contribution_list } = payload;

  let finalMembersShareList: { member_email: string; share_amount: number }[] = [];
  let finalContributionList: { member_email: string; contributed_amount: number }[] = [];

  // ===========================
  // 1️⃣ Slice Type Logic
  // ===========================
  if (slice_type === 'equal') {
    const equalShare = parseFloat((amount / perticipated_members.length).toFixed(2));
    finalMembersShareList = perticipated_members.map(email => ({
      member_email: email,
      share_amount: equalShare
    }));
  } else if (slice_type === 'custom' && members_Share_list) {
    finalMembersShareList = members_Share_list;
  }

  // ===========================
  // 2️⃣ Contribution Logic
  // ===========================
  if (contribution_type === 'custom') {
  if (!contribution_list) {
    // যদি contribution_list না আসে, সব member এর contributed_amount negative হবে
    finalContributionList = finalMembersShareList.map(member => ({
      member_email: member.member_email,
      contributed_amount: -member.share_amount
    }));
  } else {
    finalContributionList = finalMembersShareList.map(member => {
      const contributed = contribution_list.find(c => c.member_email === member.member_email);
      const contributed_amount = contributed ? contributed.contributed_amount - member.share_amount : -member.share_amount;
      return {
        member_email: member.member_email,
        contributed_amount
      };
    });
  }
}

  // ===========================
  // 3️⃣ Create DB entry
  // ===========================
  const transaction = new GroupTransection({
    amount,
    perticipated_members,
    slice_type,
    members_Share_list: finalMembersShareList,
    contribution_type,
    contribution_list: finalContributionList
  });

  return await transaction.save();
};
