import { Types } from 'mongoose';
import { GroupTransection } from './transection.model';
import ApppError from '../../error/AppError';
import status from 'http-status';
import { ExpenseOrIncomeGroupModel } from '../incomeAndExpances/incomeAndexpence.model';

interface GroupTransection {
  amount: number;
  groupId: string;
  createdBy: string;
  currency: string;
  note: string;
  perticipated_members: string[];
  slice_type: 'equal' | 'custom';
  members_Share_list: { member_email: string; share_amount?: number }[];
  contribution_type: 'allClear' | 'custom';
  contribution_list: { member_email: string; contributed_amount: number }[];
}

const createTransactionSummary = async (payload: GroupTransection) => {
  const {
    amount,
    groupId,
    currency,
    note,
    createdBy,
    slice_type,
    members_Share_list,
    contribution_type,
    contribution_list = [],
  } = payload;

  console.log({ payload });

  // Check if group exists
  const isGroupExists = await ExpenseOrIncomeGroupModel.findById(groupId);
  console.log({ isGroupExists });

  // ===========================
  // 1️⃣ Input Validation
  // ===========================
  if (!isGroupExists) {
    throw new ApppError(status.NOT_FOUND, 'Group does not exist');
  }
  if (!amount || amount <= 0) {
    throw new ApppError(status.BAD_REQUEST, 'Amount must be a positive number');
  }
  if (!createdBy) {
    throw new ApppError(status.BAD_REQUEST, 'CreatedBy is required');
  }
  if (!['equal', 'custom'].includes(slice_type as string)) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Slice type must be "equal" or "custom"',
    );
  }
  if (!['allClear', 'custom'].includes(contribution_type)) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Contribution type must be "allClear" or "custom"',
    );
  }
  if (!members_Share_list || !members_Share_list.length) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Members share list is required and cannot be empty',
    );
  }

  // Validate member emails
  const memberEmails = members_Share_list.map((m) => m.member_email);
  if (memberEmails.some((email) => !email || typeof email !== 'string')) {
    throw new ApppError(
      status.BAD_REQUEST,
      'All member emails must be valid strings',
    );
  }

  // ===========================
  // 2️⃣ Validate Emails in groupMemberList
  // ===========================
  const groupMemberEmails = isGroupExists.groupMemberList.map(
    (member: any) => member.email,
  );

  // Check members_Share_list emails
  const invalidShareEmails = members_Share_list.filter(
    (m) => !groupMemberEmails.includes(m.member_email),
  );

  console.log({ invalidShareEmails });
  if (invalidShareEmails.length > 0) {
    throw new ApppError(
      status.BAD_REQUEST,
      `The following emails are not part of the group: ${invalidShareEmails
        .map((m) => m.member_email)
        .join(', ')}`,
    );
  }

  // Check contribution_list emails
  const invalidContributionEmails = contribution_list.filter(
    (c) => !groupMemberEmails.includes(c.member_email),
  );
  if (invalidContributionEmails.length > 0) {
    throw new ApppError(
      status.BAD_REQUEST,
      `The following contributor emails are not part of the group: ${invalidContributionEmails
        .map((c) => c.member_email)
        .join(', ')}`,
    );
  }

  let finalMembersShareList: { member_email: string; share_amount: number }[] =
    [];
  let finalContributionList: {
    member_email: string;
    contributed_amount: number;
  }[] = [];

  // ===========================
  // 3️⃣ Slice Type Logic
  // ===========================
  if (slice_type === 'equal') {
    const equalShare = parseFloat(
      (amount / members_Share_list.length).toFixed(2),
    );
    finalMembersShareList = members_Share_list.map((member) => ({
      member_email: member.member_email,
      share_amount: equalShare,
    }));

    // Ensure total shares match amount (adjust last member if needed due to rounding)
    const totalShare = finalMembersShareList.reduce(
      (sum, m) => sum + m.share_amount,
      0,
    );
    if (totalShare !== amount) {
      finalMembersShareList[finalMembersShareList.length - 1].share_amount +=
        amount - totalShare;
    }
  } else if (slice_type === 'custom') {
    // Validate share_amount for custom slice type
    if (
      members_Share_list.some(
        (m) => m.share_amount == null || m.share_amount < 0,
      )
    ) {
      throw new ApppError(
        status.BAD_REQUEST,
        'Each member must have a valid non-negative share amount for custom slice type',
      );
    }

    finalMembersShareList = members_Share_list.map((m) => ({
      member_email: m.member_email,
      share_amount: m.share_amount!,
    }));

    // Validate total share_amount equals amount
    const totalShare = finalMembersShareList.reduce(
      (sum, m) => sum + m.share_amount,
      0,
    );
    if (totalShare !== amount) {
      throw new ApppError(
        status.BAD_REQUEST,
        'Total share amounts must equal the transaction amount',
      );
    }
  }

  // ===========================
  // 4️⃣ Contribution Logic
  // ===========================
  if (contribution_type === 'allClear') {
    finalContributionList = [];
  } else if (contribution_type === 'custom') {
    if (!contribution_list.length) {
      // If no contribution_list provided, assume members owe their share
      finalContributionList = finalMembersShareList.map((member) => ({
        member_email: member.member_email,
        contributed_amount: -member.share_amount,
      }));
    } else {
      // Validate contribution_list
      if (
        contribution_list.some(
          (c) => c.contributed_amount < 0 || !c.member_email,
        )
      ) {
        throw new ApppError(
          status.BAD_REQUEST,
          'Contribution list must have valid non-negative amounts and emails',
        );
      }

      // Calculate total contributed amount
      const totalContributed = contribution_list.reduce(
        (sum, c) => sum + c.contributed_amount,
        0,
      );
      if (totalContributed !== amount) {
        throw new ApppError(
          status.BAD_REQUEST,
          'Total contributed amount must equal the transaction amount',
        );
      }

      // Build contribution list
      finalContributionList = finalMembersShareList.map((member) => {
        const contributed = contribution_list.find(
          (c) => c.member_email === member.member_email,
        );
        const contributed_amount = contributed
          ? contributed.contributed_amount - member.share_amount
          : -member.share_amount;
        return {
          member_email: member.member_email,
          contributed_amount,
        };
      });

      // Include contributors who are not in members_Share_list
      contribution_list.forEach((c) => {
        if (
          !finalMembersShareList.find((m) => m.member_email === c.member_email)
        ) {
          finalContributionList.push({
            member_email: c.member_email,
            contributed_amount: c.contributed_amount,
          });
        }
      });
    }
  }

  // ===========================
  // 5️⃣ Participated Members
  // ===========================
  const perticipated_members = [
    ...new Set([
      ...finalMembersShareList.map((m) => m.member_email),
      ...finalContributionList.map((c) => c.member_email),
    ]),
  ];

  // ===========================
  // 6️⃣ Save to DB
  // ===========================
  const transaction = new GroupTransection({
    amount,
    groupId,
    createdBy,
    currency,
    note,
    perticipated_members,
    slice_type,
    members_Share_list: finalMembersShareList,
    contribution_type,
    contribution_list: finalContributionList,
  });

  return await transaction.save();
};

interface Payback {
  from: string;
  to: string;
  amount: number;
}

const paybackTransectionAmountToDB = async (payload: {
  transectionId: string;
  paybacks: Payback[];
}) => {
  try {
    const { transectionId, paybacks } = payload;

    if (!transectionId) throw new Error('transectionId is required');

    const transaction = await GroupTransection.findById(transectionId);
    if (!transaction) throw new Error('Transaction not found');

    let contributionList = [...(transaction.contribution_list || [])];
    let memberShareList = [...(transaction.members_Share_list || [])];
    let paybackList = [...(transaction.paybacks || [])]; // Initialize payback list from DB

    // Fast lookup maps
    const contributionMap = new Map<string, number>();
    const memberShareMap = new Map<string, number>();
    const originalContributionMap = new Map<string, number>();
    const totalPaybackMap = new Map<string, number>(); // Track total payback amount per 'from' member

    contributionList.forEach((item) => {
      contributionMap.set(item.member_email, item.contributed_amount);
      originalContributionMap.set(item.member_email, item.contributed_amount);
    });

    memberShareList.forEach((item) => {
      memberShareMap.set(item.member_email, item.share_amount);
    });

    // Calculate total payback amounts per 'from' member
    paybackList.forEach((payback) => {
      const currentTotal = totalPaybackMap.get(payback.from) || 0;
      totalPaybackMap.set(payback.from, currentTotal + payback.amount);
    });

    // Map to track existing paybacks by from-to pair
    const paybackMap = new Map<
      string,
      { from: string; to: string; amount: number; _id?: string }
    >();
    paybackList.forEach((payback) => {
      const key = `${payback.from}-${payback.to}`;
      paybackMap.set(key, {
        from: payback.from,
        to: payback.to,
        amount: payback.amount,
      });
    });

    // Apply paybacks and update payback information
    for (const payback of paybacks) {
      const fromShareAmount = memberShareMap.get(payback.from) || 0;
      const currentTotalPayback = totalPaybackMap.get(payback.from) || 0;

      // Check if the member has already paid back their full share_amount
      if (currentTotalPayback + payback.amount > fromShareAmount) {
        throw new Error(
          `Invalid payback: ${payback.from} cannot payback more than their share amount (${fromShareAmount})`,
        );
      }

      let fromAmount = contributionMap.get(payback.from) || 0;
      const toAmount = contributionMap.get(payback.to) || 0;

      const originalFromAmount = originalContributionMap.get(payback.from) || 0;
      if (originalFromAmount === 0) {
        fromAmount = memberShareMap.get(payback.from) || 0;
      }

      contributionMap.set(payback.from, fromAmount + payback.amount);

      const newToAmount = toAmount - payback.amount;
      if (newToAmount < 0) {
        throw new Error(
          `Invalid payback: ${payback.to} cannot have negative contribution`,
        );
      }

      contributionMap.set(payback.to, newToAmount);

      // Update or add payback to paybackMap
      const key = `${payback.from}-${payback.to}`;
      if (paybackMap.has(key)) {
        // If payback exists for this from-to pair, add the amount
        const existingPayback = paybackMap.get(key)!;
        existingPayback.amount += payback.amount;
        paybackMap.set(key, existingPayback);
      } else {
        // If no payback exists, create a new entry
        paybackMap.set(key, {
          from: payback.from,
          to: payback.to,
          amount: payback.amount,
        });
      }

      // Update total payback amount for this 'from' member
      totalPaybackMap.set(payback.from, currentTotalPayback + payback.amount);
    }

    // Rebuild the contribution list
    contributionList = contributionList.map((item) => ({
      member_email: item.member_email,
      contributed_amount: contributionMap.get(item.member_email) || 0,
    }));

    // Rebuild paybackList from paybackMap
    paybackList = Array.from(paybackMap.values()).map(
      ({ from, to, amount, _id }) => ({
        from,
        to,
        amount,
        ...(_id && { _id }), // Include _id only if it exists
      }),
    );

    // Update DB with contribution_list and paybacks
    const updatedTransaction = await GroupTransection.findByIdAndUpdate(
      transectionId,
      {
        $set: {
          contribution_list: contributionList,
          paybacks: paybackList, // Store updated paybacks in DB
        },
      },
      { new: true },
    );

    // ✅ Type-safe null check
    if (!updatedTransaction) {
      throw new Error('Transaction update failed or not found');
    }

    // Customize response: show share_amount if contribution is 0
    const responseContributionList = updatedTransaction.contribution_list.map(
      (item) => {
        const isZero = item.contributed_amount === 0;
        const shareAmount = memberShareMap.get(item.member_email) || 0;

        return {
          member_email: item.member_email,
          contributed_amount: isZero ? shareAmount : item.contributed_amount,
        };
      },
    );

    // Return final response object
    return {
      ...updatedTransaction.toObject(),
      contribution_list: responseContributionList,
    };
  } catch (err: any) {
    // console.error('❌ Error processing paybacks:', err.message);
    throw err;
  }
};

const addMemberToEqualTransection = async (data: {
  transectionId: string;
  members_Share_list: { member_email: string }[];
}) => {
  console.log('Add member...', data);

  // 1️⃣ Validate input and fetch transaction
  const { transectionId, members_Share_list } = data;

  if (!transectionId || !members_Share_list || !members_Share_list.length) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Transaction ID and member email list are required',
    );
  }

  const transaction = await GroupTransection.findById(transectionId);
  if (!transaction) {
    throw new ApppError(status.NOT_FOUND, 'Transaction not found');
  }

  // 2️⃣ Validate transaction type
  if (
    transaction.slice_type !== 'equal' ||
    transaction.contribution_type !== 'allClear'
  ) {
    throw new ApppError(
      status.CONFLICT,
      'New members can only be added to transactions with equal slice type and allClear contribution type',
    );
  }

  // 3️⃣ Check for duplicate members
  const newMemberEmails = members_Share_list.map((m) => m.member_email);
  const existingMemberEmails = transaction.perticipated_members || [];
  const duplicates = newMemberEmails.filter((email) =>
    existingMemberEmails.includes(email),
  );

  if (duplicates.length > 0) {
    throw new ApppError(
      status.CONFLICT,
      `Members already exist in the transaction: ${duplicates.join(', ')}`,
    );
  }

  // 4️⃣ Calculate new equal share
  const totalMembers = existingMemberEmails.length + newMemberEmails.length;
  const newEqualShare = parseFloat(
    (transaction.amount / totalMembers).toFixed(2),
  );

  // 5️⃣ Update members_Share_list with new equal shares
  const updatedMembersShareList = [
    ...transaction.members_Share_list.map((member) => ({
      member_email: member.member_email,
      share_amount: newEqualShare,
    })),
    ...newMemberEmails.map((email) => ({
      member_email: email,
      share_amount: newEqualShare,
    })),
  ];

  // 7️⃣ Update perticipated_members
  const updatedParticipatedMembers = [
    ...new Set([...existingMemberEmails, ...newMemberEmails]),
  ];

  // 8️⃣ Save updated transaction to the database
  const updatedTransaction = await GroupTransection.findByIdAndUpdate(
    transectionId,
    {
      $set: {
        members_Share_list: updatedMembersShareList,
        perticipated_members: updatedParticipatedMembers,
      },
    },
    { new: true },
  );

  if (!updatedTransaction) {
    throw new ApppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to update transaction',
    );
  }

  return updatedTransaction;
};
const addMemberToCustomTransection = async (data: {
  transectionId: string;
  members_Share_list: { member_email: string; share_amount: number }[];
}) => {
  console.log('Add member to custom transaction...', data);

  // 1️⃣ Validate input
  const { transectionId, members_Share_list } = data;

  if (!transectionId || !members_Share_list || !members_Share_list.length) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Transaction ID and member email list with share amounts are required',
    );
  }

  // Validate that share_amount is provided and valid for each new member
  if (
    members_Share_list.some((m) => m.share_amount == null || m.share_amount < 0)
  ) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Each new member must have a valid non-negative share amount',
    );
  }

  // 2️⃣ Fetch transaction
  const transaction = await GroupTransection.findById(transectionId);
  if (!transaction) {
    throw new ApppError(status.NOT_FOUND, 'Transaction not found');
  }

  // 3️⃣ Validate transaction type
  if (
    transaction.slice_type !== 'custom' ||
    transaction.contribution_type !== 'allClear'
  ) {
    throw new ApppError(
      status.CONFLICT,
      'New members can only be added to transactions with custom slice type and allClear contribution type',
    );
  }

  // 4️⃣ Check for duplicate members
  const newMemberEmails = members_Share_list.map((m) => m.member_email);
  const existingMemberEmails = transaction.perticipated_members || [];
  const duplicates = newMemberEmails.filter((email) =>
    existingMemberEmails.includes(email),
  );

  if (duplicates.length > 0) {
    throw new ApppError(
      status.CONFLICT,
      `Members already exist in the transaction: ${duplicates.join(', ')}`,
    );
  }

  // 5️⃣ Calculate new total amount
  const currentTotalShare = transaction.members_Share_list.reduce(
    (sum, member) => sum + member.share_amount,
    0,
  );
  const newMemberTotalShare = members_Share_list.reduce(
    (sum, member) => sum + member.share_amount,
    0,
  );
  const updatedTotalAmount = currentTotalShare + newMemberTotalShare;

  // 6️⃣ Update members_Share_list
  const updatedMembersShareList = [
    ...transaction.members_Share_list,
    ...members_Share_list.map((m) => ({
      member_email: m.member_email,
      share_amount: m.share_amount,
    })),
  ];

  // 8️⃣ Update perticipated_members
  const updatedParticipatedMembers = [
    ...new Set([...existingMemberEmails, ...newMemberEmails]),
  ];

  // 9️⃣ Save updated transaction to the database
  const updatedTransaction = await GroupTransection.findByIdAndUpdate(
    transectionId,
    {
      $set: {
        amount: updatedTotalAmount,
        members_Share_list: updatedMembersShareList,
        perticipated_members: updatedParticipatedMembers,
      },
    },
    { new: true },
  );

  if (!updatedTransaction) {
    throw new ApppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to update transaction',
    );
  }

  return updatedTransaction;
};

const addMemberToTransaction = async (data: {
  transectionId: string;
  members_Share_list: { member_email: string; share_amount?: number }[];
}) => {
  console.log('Add member to transaction...', data);

  // 1️⃣ Validate input
  const { transectionId, members_Share_list } = data;

  if (!transectionId || !members_Share_list || !members_Share_list.length) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Transaction ID and member email list are required',
    );
  }

  // 2️⃣ Fetch transaction
  const transaction = await GroupTransection.findById(transectionId);
  if (!transaction) {
    throw new ApppError(status.NOT_FOUND, 'Transaction not found');
  }

  // 3️⃣ Validate transaction type
  if (transaction.contribution_type !== 'allClear') {
    throw new ApppError(
      status.CONFLICT,
      'New members can only be added to transactions with allClear contribution type',
    );
  }

  if (!['equal', 'custom'].includes(transaction.slice_type as string)) {
    throw new ApppError(
      status.CONFLICT,
      'Transaction must have equal or custom slice type',
    );
  }

  // 4️⃣ Check for duplicate members
  const newMemberEmails = members_Share_list.map((m) => m.member_email);
  const existingMemberEmails = transaction.perticipated_members || [];
  const duplicates = newMemberEmails.filter((email) =>
    existingMemberEmails.includes(email),
  );

  if (duplicates.length > 0) {
    throw new ApppError(
      status.CONFLICT,
      `Members already exist in the transaction: ${duplicates.join(', ')}`,
    );
  }

  // 5️⃣ Prepare updated members share list and total amount based on slice_type
  let updatedMembersShareList = [...transaction.members_Share_list];
  let updatedTotalAmount = transaction.amount;

  if (transaction.slice_type === 'equal') {
    // For equal transactions, recalculate share for all members
    const totalMembers = existingMemberEmails.length + newMemberEmails.length;
    const newEqualShare = parseFloat(
      (transaction.amount / totalMembers).toFixed(2),
    );

    updatedMembersShareList = [
      ...transaction.members_Share_list.map((member) => ({
        member_email: member.member_email,
        share_amount: newEqualShare,
      })),
      ...newMemberEmails.map((email) => ({
        member_email: email,
        share_amount: newEqualShare,
      })),
    ];
  } else if (transaction.slice_type === 'custom') {
    // For custom transactions, validate share_amount and update total
    if (
      members_Share_list.some(
        (m) => m.share_amount == null || m.share_amount < 0,
      )
    ) {
      throw new ApppError(
        status.BAD_REQUEST,
        'Each new member must have a valid non-negative share amount',
      );
    }

    const newMemberTotalShare = members_Share_list.reduce(
      (sum, member) => sum + (member.share_amount || 0),
      0,
    );
    updatedTotalAmount =
      transaction.members_Share_list.reduce(
        (sum, member) => sum + member.share_amount,
        0,
      ) + newMemberTotalShare;

    updatedMembersShareList = [
      ...transaction.members_Share_list,
      ...members_Share_list.map((m) => ({
        member_email: m.member_email,
        share_amount: m.share_amount!,
      })),
    ];
  }

  // 6️⃣ Update participated members
  const updatedParticipatedMembers = [
    ...new Set([...existingMemberEmails, ...newMemberEmails]),
  ];

  // 7️⃣ Save updated transaction to the database
  const updatedTransaction = await GroupTransection.findByIdAndUpdate(
    transectionId,
    {
      $set: {
        amount: updatedTotalAmount,
        members_Share_list: updatedMembersShareList,
        perticipated_members: updatedParticipatedMembers,
      },
    },
    { new: true },
  );

  if (!updatedTransaction) {
    throw new ApppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to update transaction',
    );
  }

  return updatedTransaction;
};

const deleteMemberFromEqualTransection = async (data: {
  transectionId: string;
  member_email: string;
}) => {
  console.log('Delete member from equal transaction...', data);

  // 1️⃣ Validate input
  const { transectionId, member_email } = data;

  if (!transectionId || !member_email) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Transaction ID and member email are required',
    );
  }

  // 2️⃣ Fetch transaction
  const transaction = await GroupTransection.findById(transectionId);
  if (!transaction) {
    throw new ApppError(status.NOT_FOUND, 'Transaction not found');
  }

  // 3️⃣ Validate transaction type
  if (
    transaction.slice_type !== 'equal' ||
    transaction.contribution_type !== 'allClear'
  ) {
    throw new ApppError(
      status.CONFLICT,
      'Members can only be deleted from transactions with equal slice type and allClear contribution type',
    );
  }

  // 4️⃣ Check if member exists and can be deleted
  const existingMemberEmails = transaction.perticipated_members || [];
  if (!existingMemberEmails.includes(member_email)) {
    throw new ApppError(
      status.NOT_FOUND,
      `Member ${member_email} not found in the transaction`,
    );
  }

  if (existingMemberEmails.length <= 1) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Cannot delete the last member from the transaction',
    );
  }

  // 5️⃣ Calculate the removed member's share and new total amount
  const totalMembers = existingMemberEmails.length;
  const removedMemberShare = parseFloat(
    (transaction.amount / totalMembers).toFixed(2),
  );
  const updatedTotalAmount = parseFloat(
    (transaction.amount - removedMemberShare).toFixed(2),
  );

  // 6️⃣ Update perticipated_members
  const updatedParticipatedMembers = existingMemberEmails.filter(
    (email) => email !== member_email,
  );

  // 7️⃣ Calculate new equal share for remaining members
  const newEqualShare = parseFloat(
    (updatedTotalAmount / updatedParticipatedMembers.length).toFixed(2),
  );

  // 8️⃣ Update members_Share_list
  const updatedMembersShareList = transaction.members_Share_list
    .filter((member) => member.member_email !== member_email)
    .map((member) => ({
      member_email: member.member_email,
      share_amount: newEqualShare,
    }));

  // 10️⃣ Save updated transaction to the database
  const updatedTransaction = await GroupTransection.findByIdAndUpdate(
    transectionId,
    {
      $set: {
        amount: updatedTotalAmount,
        members_Share_list: updatedMembersShareList,
        perticipated_members: updatedParticipatedMembers,
      },
    },
    { new: true },
  );

  if (!updatedTransaction) {
    throw new ApppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to update transaction',
    );
  }

  return updatedTransaction;
};

const leaveAMemberFromGroup = async (data: {
  groupId: string;
  member_email: string;
}) => {
  console.log('Removing member from group...', data);

  // 1️⃣ Validate input
  const { groupId, member_email } = data;

  if (!groupId || !member_email) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Group ID and member email are required',
    );
  }

  // 2️⃣ Fetch group
  const group = await ExpenseOrIncomeGroupModel.findById(groupId);
  if (!group) {
    throw new ApppError(status.NOT_FOUND, 'Group not found');
  }

  const groupMemberEmails = group.groupMemberList.map(
    (member: any) => member.email,
  );
  if (!groupMemberEmails.includes(member_email)) {
    throw new ApppError(
      status.NOT_FOUND,
      `Member ${member_email} not found in the group`,
    );
  }

  // 4️⃣ Prevent removal if the member is the last one
  if (group.groupMemberList.length <= 1) {
    throw new ApppError(
      status.BAD_REQUEST,
      'Cannot remove the last member from the group',
    );
  }

  // console.log(groupMemberEmails)

  // 5️⃣ Update groupMemberList by removing the member
  const updatedGroupMemberList = group.groupMemberList.filter(
    (member: any) => member.email !== member_email,
  );
  const updatedGroup = await ExpenseOrIncomeGroupModel.findByIdAndUpdate(
    groupId,
    {
      $set: {
        groupMemberList: updatedGroupMemberList,
      },
    },
    { new: true },
  );

  return updatedGroup;
};

const getAllTransection = async (createdBy: string) => {
  // console.log({createdBy})

  const result = await GroupTransection.find({ createdBy });
  return result;
};

export const TransectionService = {
  createTransactionSummary,
  paybackTransectionAmountToDB,
  addMemberToEqualTransection,
  getAllTransection,
  addMemberToCustomTransection,
  deleteMemberFromEqualTransection,
  addMemberToTransaction,
  leaveAMemberFromGroup,
};
