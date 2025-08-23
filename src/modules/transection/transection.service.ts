// import { GroupTransection } from "./transection.model";

import { GroupTransection } from './transection.model';

// interface CreateTransactionPayload {
//   amount: number;
//   perticipated_members: string[];
//   slice_type: 'equal' | 'custom' | null;
//   members_Share_list?: { member_email: string; share_amount: number }[];
//   contribution_type: 'allClear' | 'custom';
//   contribution_list?: { member_email: string; contributed_amount: number }[];
// }

// export const createTransactionSummary = async (payload: CreateTransactionPayload) => {
//   const { amount, perticipated_members, slice_type, members_Share_list, contribution_type, contribution_list } = payload;

//   let finalMembersShareList: { member_email: string; share_amount: number }[] = [];
//   let finalContributionList: { member_email: string; contributed_amount: number }[] = [];

//   // ===========================
//   // 1️⃣ Slice Type Logic
//   // ===========================
//   if (slice_type === 'equal') {
//     const equalShare = parseFloat((amount / perticipated_members.length).toFixed(2));
//     finalMembersShareList = perticipated_members.map(email => ({
//       member_email: email,
//       share_amount: equalShare
//     }));
//   } else if (slice_type === 'custom' && members_Share_list) {
//     finalMembersShareList = members_Share_list;
//   }

//   // ===========================
//   // 2️⃣ Contribution Logic
//   // ===========================
//   if (contribution_type === 'custom') {
//   if (!contribution_list) {
//     // যদি contribution_list না আসে, সব member এর contributed_amount negative হবে
//     finalContributionList = finalMembersShareList.map(member => ({
//       member_email: member.member_email,
//       contributed_amount: -member.share_amount
//     }));
//   } else {
//     finalContributionList = finalMembersShareList.map(member => {
//       const contributed = contribution_list.find(c => c.member_email === member.member_email);
//       const contributed_amount = contributed ? contributed.contributed_amount - member.share_amount : -member.share_amount;
//       return {
//         member_email: member.member_email,
//         contributed_amount
//       };
//     });
//   }
// }

//   // ===========================
//   // 3️⃣ Create DB entry
//   // ===========================
//   const transaction = new GroupTransection({
//     amount,
//     perticipated_members,
//     slice_type,
//     members_Share_list: finalMembersShareList,
//     contribution_type,
//     contribution_list: finalContributionList
//   });

//   return await transaction.save();
// };

interface CreateTransactionPayload {
  amount: number;
  slice_type: 'equal' | 'custom' | null;
  members_Share_list: { member_email: string; share_amount: number }[];
  contribution_type: 'allClear' | 'custom';
  contribution_list?: { member_email: string; contributed_amount: number }[];
}

// export const createTransactionSummary = async (payload: CreateTransactionPayload) => {
//   const { amount, slice_type, members_Share_list, contribution_type, contribution_list } = payload;

//   let finalMembersShareList: { member_email: string; share_amount: number }[] = [];
//   let finalContributionList: { member_email: string; contributed_amount: number }[] = [];

//   // ===========================
//   // 1️⃣ Slice Type Logic
//   // ===========================
//   if (slice_type === 'equal') {
//     // সব member এর জন্য সমান ভাগ হবে
//     const members = members_Share_list.map(m => m.member_email);
//     const equalShare = parseFloat((amount / members.length).toFixed(2));

//     finalMembersShareList = members.map(email => ({
//       member_email: email,
//       share_amount: equalShare
//     }));
//   } else if (slice_type === 'custom') {
//     // custom হলে যা আসবে সেটাই নেবে
//     finalMembersShareList = members_Share_list;
//   }

//   // ===========================
//   // 2️⃣ Contribution Logic
//   // ===========================
//   if (contribution_type === 'custom') {
//     if (!contribution_list) {
//       // contribution_list না এলে সবার contributed_amount = -share_amount
//       finalContributionList = finalMembersShareList.map(member => ({
//         member_email: member.member_email,
//         contributed_amount: -member.share_amount
//       }));
//     } else {
//       finalContributionList = finalMembersShareList.map(member => {
//         const contributed = contribution_list.find(c => c.member_email === member.member_email);
//         const contributed_amount = contributed
//           ? contributed.contributed_amount - member.share_amount
//           : -member.share_amount;
//         return {
//           member_email: member.member_email,
//           contributed_amount
//         };
//       });
//     }
//   }

//   // ===========================
//   // 3️⃣ perticipated_members বানানো
//   // ===========================
//   const perticipated_members = [
//   ...new Set([
//     ...finalMembersShareList.map(m => m.member_email),
//     ...(finalContributionList?.map(c => c.member_email) || [])
//   ])
// ];
//   // ===========================
//   // 4️⃣ Create DB entry
//   // ===========================
//   const transaction = new GroupTransection({
//     amount,
//     perticipated_members,
//     slice_type,
//     members_Share_list: finalMembersShareList,
//     contribution_type,
//     contribution_list: finalContributionList
//   });

//   return await transaction.save();
// };

interface CreateTransactionPayload {
  amount: number;
  slice_type: 'equal' | 'custom' | null;
  members_Share_list: { member_email: string; share_amount: number }[];
  contribution_type: 'allClear' | 'custom';
  contribution_list?: { member_email: string; contributed_amount: number }[];
}

export const createTransactionSummary = async (
  payload: CreateTransactionPayload,
) => {
  const {
    amount,
    slice_type,
    members_Share_list,
    contribution_type,
    contribution_list,
  } = payload;

  let finalMembersShareList: { member_email: string; share_amount: number }[] =
    [];
  let finalContributionList: {
    member_email: string;
    contributed_amount: number;
  }[] = [];

  // ===========================
  // 1️⃣ Slice Type Logic
  // ===========================
  if (slice_type === 'equal') {
    const members = members_Share_list.map((m) => m.member_email);
    const equalShare = parseFloat((amount / members.length).toFixed(2));

    finalMembersShareList = members.map((email) => ({
      member_email: email,
      share_amount: equalShare,
    }));
  } else if (slice_type === 'custom') {
    finalMembersShareList = members_Share_list;
  }

  // ===========================
  // 2️⃣ Contribution Logic
  // ===========================
  if (contribution_type === 'custom') {
    if (!contribution_list) {
      finalContributionList = finalMembersShareList.map((member) => ({
        member_email: member.member_email,
        contributed_amount: -member.share_amount,
      }));
    } else {
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

      // যদি এমন কেউ থাকে যিনি pay করেছেন কিন্তু share list এ নাই → তাকেও include করতে হবে
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
  // 3️⃣ perticipated_members বানানো
  // ===========================
  const perticipated_members = [
    ...new Set([
      ...finalMembersShareList.map((m) => m.member_email),
      ...(finalContributionList?.map((c) => c.member_email) || []),
    ]),
  ];

  // ===========================
  // 4️⃣ Save to DB
  // ===========================
  const transaction = new GroupTransection({
    amount,
    perticipated_members,
    slice_type,
    members_Share_list: finalMembersShareList,
    contribution_type,
    contribution_list: finalContributionList,
  });

  return await transaction.save();
};

interface MemberShare {
  member_email: string;
  share_amount: number;
  _id?: string;
}

interface Contribution {
  member_email: string;
  contributed_amount: number;
  _id?: string;
}

interface Payback {
  from: string;
  to: string;
  amount: number;
}




// export const paybackTransectionAmountToDB = async (payload: {
//   transectionId: string;
//   paybacks: Payback[];
// }) => {
//   try {
//     const { transectionId, paybacks } = payload;

//     if (!transectionId) throw new Error('transectionId is required');

//     const transaction = await GroupTransection.findById(transectionId);
//     if (!transaction) throw new Error('Transaction not found');

//     let contributionList = [...(transaction.contribution_list || [])];
//     let memberShareList = [...(transaction.members_Share_list || [])];

//     // Fast lookup maps
//     const contributionMap = new Map<string, number>();
//     const memberShareMap = new Map<string, number>();
//     const originalContributionMap = new Map<string, number>();

//     contributionList.forEach((item) => {
//       contributionMap.set(item.member_email, item.contributed_amount);
//       originalContributionMap.set(item.member_email, item.contributed_amount);
//     });

//     memberShareList.forEach((item) => {
//       memberShareMap.set(item.member_email, item.share_amount);
//     });

//     // Apply paybacks
//     for (const payback of paybacks) {
//       let fromAmount = contributionMap.get(payback.from) || 0;
//       const toAmount = contributionMap.get(payback.to) || 0;

//       const originalFromAmount = originalContributionMap.get(payback.from) || 0;
//       if (originalFromAmount === 0) {
//         fromAmount = memberShareMap.get(payback.from) || 0;
//       }

//       contributionMap.set(payback.from, fromAmount + payback.amount);

//       const newToAmount = toAmount - payback.amount;
//       if (newToAmount < 0) {
//         throw new Error(`Invalid payback: ${payback.to} cannot have negative contribution`);
//       }

//       contributionMap.set(payback.to, newToAmount);
//     }

//     // Rebuild the contribution list
//     contributionList = contributionList.map((item) => ({
//       member_email: item.member_email,
//       contributed_amount: contributionMap.get(item.member_email) || 0,
//     }));

//     // Update DB
//     const updatedTransaction = await GroupTransection.findByIdAndUpdate(
//       transectionId,
//       {
//         $set: {
//           contribution_list: contributionList,
//           // Uncomment below if you want to store paybacks too
//           // paybacks: paybacks,
//         },
//       },
//       { new: true }
//     );

//     // ✅ Type-safe null check
//     if (!updatedTransaction) {
//       throw new Error('Transaction update failed or not found');
//     }

//     // Customize response: show share_amount if contribution is 0
//     const responseContributionList = updatedTransaction.contribution_list.map((item) => {
//       const isZero = item.contributed_amount === 0;
//       const shareAmount = memberShareMap.get(item.member_email) || 0;

//       return {
//         member_email: item.member_email,
//         contributed_amount: isZero ? shareAmount : item.contributed_amount,
//       };
//     });

//     // Return final response object
//     return {
//       ...updatedTransaction.toObject(),
//       contribution_list: responseContributionList,
//     };
//   } catch (err: any) {
//     console.error('❌ Error processing paybacks:', err.message);
//     throw err;
//   }
// };




export const paybackTransectionAmountToDB = async (payload: {
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
    const paybackMap = new Map<string, { from: string; to: string; amount: number; _id?: string }>();
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
          `Invalid payback: ${payback.from} cannot payback more than their share amount (${fromShareAmount})`
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
        throw new Error(`Invalid payback: ${payback.to} cannot have negative contribution`);
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
    paybackList = Array.from(paybackMap.values()).map(({ from, to, amount, _id }) => ({
      from,
      to,
      amount,
      ...(_id && { _id }), // Include _id only if it exists
    }));

    // Update DB with contribution_list and paybacks
    const updatedTransaction = await GroupTransection.findByIdAndUpdate(
      transectionId,
      {
        $set: {
          contribution_list: contributionList,
          paybacks: paybackList, // Store updated paybacks in DB
        },
      },
      { new: true }
    );

    // ✅ Type-safe null check
    if (!updatedTransaction) {
      throw new Error('Transaction update failed or not found');
    }

    // Customize response: show share_amount if contribution is 0
    const responseContributionList = updatedTransaction.contribution_list.map((item) => {
      const isZero = item.contributed_amount === 0;
      const shareAmount = memberShareMap.get(item.member_email) || 0;

      return {
        member_email: item.member_email,
        contributed_amount: isZero ? shareAmount : item.contributed_amount,
      };
    });

    // Return final response object
    return {
      ...updatedTransaction.toObject(),
      contribution_list: responseContributionList,
    };
  } catch (err: any) {
    console.error('❌ Error processing paybacks:', err.message);
    throw err;
  }
};