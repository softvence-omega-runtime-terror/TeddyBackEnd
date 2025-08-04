import { ClientSession, Types } from "mongoose";
import { ExpenseOrIncomeGroupModel, TransactionModel } from "../incomeAndExpances/incomeAndexpence.model";


const updateGroupAndTransactions = async (
  email: string,
  userId: Types.ObjectId,
  session: ClientSession,
) => {
  try {
    console.log('Updating group members and transactions for email:', email);

    // Validate inputs
    if (!email || !userId) {
      throw new Error('Email and userId are required.');
    }

    // Update group member list where email matches, group is not deleted, and member does not yet exist on platform
    const groupUpdateResult = await ExpenseOrIncomeGroupModel.updateMany(
      {
        'groupMemberList.email': email,
        'groupMemberList.existOnPlatform': false,
        isDeleted: false, // Only update non-deleted groups
      },
      {
        $set: {
          'groupMemberList.$[elem].member_id': userId,
          'groupMemberList.$[elem].existOnPlatform': true,
          'groupMemberList.$[elem].isDeleted': false, // Ensure member is not marked as deleted
        },
      },
      {
        arrayFilters: [{ 'elem.email': email }],
        session,
      },
    );
    console.log('Group member updates:', groupUpdateResult);

    // Update transactions where spender_id_Or_Email or earnedBy_id_Or_Email matches the email
    const transactionUpdateResult = await TransactionModel.updateMany(
      {
        $or: [
          { spender_id_Or_Email: email },
          { earnedBy_id_Or_Email: email },
        ],
      },
      [
        {
          $set: {
            spender_id_Or_Email: {
              $cond: {
                if: { $eq: ['$spender_id_Or_Email', email] },
                then: userId,
                else: '$spender_id_Or_Email',
              },
            },
            earnedBy_id_Or_Email: {
              $cond: {
                if: { $eq: ['$earnedBy_id_Or_Email', email] },
                then: userId,
                else: '$earnedBy_id_Or_Email',
              },
            },
          },
        },
      ],
      { session },
    );
    console.log('Transaction updates:', transactionUpdateResult);

    return {
      success: true,
      message: 'Group members and transactions updated successfully.',
      modifiedGroups: groupUpdateResult.modifiedCount,
      modifiedTransactions: transactionUpdateResult.modifiedCount,
    };
  } catch (error: any) {
    console.error('Update failed:', error);
    throw new Error(error.message || 'Failed to update group and transactions.');
  }
};

export default updateGroupAndTransactions;