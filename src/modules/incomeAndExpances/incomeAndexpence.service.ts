import mongoose, { startSession, Types } from 'mongoose';
import {
  ExpenseTypesModel,
  IncomeTypesModel,
  TransactionModel,
  ExpenseOrIncomeGroupModel,
} from './incomeAndexpence.model';
import { uploadImgToCloudinary } from '../../util/uploadImgToCludinary';
import { transactionTypeConst } from '../../constants';
import idConverter from '../../util/idConverter';
import { sendEmail } from '../../util/sendEmail';
import { ProfileModel } from '../user/user.model';
import config from '../../config';



interface UpdateFields {
  groupName?: string;
  groupType?: 'expense' | 'income';
  groupMemberList?: {
    email: string;
    member_id?: Types.ObjectId | null;
    existOnPlatform?: boolean;
    isInvitationEmailSent?: boolean;
    name?: string;
    isDeleted?: boolean;
  }[];
  reDistributeAmount?: number;
}

// Subdocument Interfaces for Service
interface IncomeTypeSubdocument {
  img?: string | null;
  name: string;
}
interface IncomeTypesDocument extends Document {
  user_id?: Types.ObjectId | null;
  incomeTypeList: Types.DocumentArray<IncomeTypeSubdocument>;
}
interface ExpenseTypeSubdocument {
  img?: string | null;
  name: string;
}
interface ExpenseTypesDocument extends Document {
  user_id?: Types.ObjectId | null;
  expenseTypeList: Types.DocumentArray<ExpenseTypeSubdocument>;
}

//.................//...........///..................//...........///.

const createIncomeType = async (
  payload: any,
  user_id: Types.ObjectId | null = null,
  file: any,
) => {
  try {
    console.log('Payload for creating income type:', { user_id, payload });

    // Validate payload
    const { name } = payload;
    if (!name) {
      throw new Error('Income type name is required');
    }

    // Handle single file upload to Cloudinary
    let imageUrl: string | null = null;
    if (file) {
      const imageName = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}`;
      const uploadResult = await uploadImgToCloudinary(imageName, file.path);
      imageUrl = uploadResult.secure_url;
    }

    // Prepare new income type object
    const newIncomeType: IncomeTypeSubdocument = {
      img: imageUrl,
      name,
    };

    // Query condition: user_id for specific users, null for common types
    const query = user_id ? { user_id } : { user_id: null };

    // Check if a document exists
    const existingIncomeTypes =
      await IncomeTypesModel.findOne<IncomeTypesDocument>(query);

    if (existingIncomeTypes) {
      // Check for duplicate name in the existing document
      const isDuplicate = existingIncomeTypes.incomeTypeList.some(
        (incomeType) => incomeType.name === payload.name,
      );

      if (isDuplicate) {
        throw new Error(`Income type '${payload.name}' already exists`);
      }

      // Update existing document by pushing new income type and return updated document
      const updatedIncomeTypes = await IncomeTypesModel.findOneAndUpdate(
        query,
        { $push: { incomeTypeList: newIncomeType } },
        { new: true },
      );

      return updatedIncomeTypes;
    } else {
      // Create new document with the income type
      const newIncomeTypes = await IncomeTypesModel.create({
        user_id,
        incomeTypeList: [newIncomeType],
      });
      return newIncomeTypes;
    }
  } catch (error: any) {
    console.error('Error in createIncomeType service:', error.message);
    throw new Error(`Failed to create income type: ${error.message}`);
  }
};
const getAllIncomeType = async (user_id: Types.ObjectId) => {
  try {
    // Find user-specific income types
    const userIncomeTypes = await IncomeTypesModel.findOne({ user_id });

    // Find common income types (where user_id is null)
    const commonIncomeTypes = await IncomeTypesModel.findOne({ user_id: null });

    // Initialize result array
    const result = [];

    // Add user-specific income types to the top of the result array
    if (userIncomeTypes && userIncomeTypes.incomeTypeList) {
      result.push(...userIncomeTypes.incomeTypeList);
    }

    // Add common income types to the bottom of the result array
    if (commonIncomeTypes && commonIncomeTypes.incomeTypeList) {
      result.push(...commonIncomeTypes.incomeTypeList);
    }

    return result;
  } catch (error: any) {
    console.error('Error in getAllIncomeType service:', error.message);
    throw new Error(`Failed to fetch income types: ${error.message}`);
  }
};
const createExpensesType = async (
  payload: any,
  user_id: Types.ObjectId | null = null,
  file: any,
) => {
  try {
    console.log('Payload for creating expense type:', { user_id, payload });

    // Validate payload
    const { name } = payload;
    if (!name) {
      throw new Error('Expense type name is required');
    }

    // Handle single file upload to Cloudinary
    let imageUrl: string | null = null;
    if (file) {
      const imageName = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}`;
      const uploadResult = await uploadImgToCloudinary(imageName, file.path);
      imageUrl = uploadResult.secure_url;
    }

    // Prepare new expense type object
    const newExpenseType: ExpenseTypeSubdocument = {
      img: imageUrl,
      name,
    };

    // Query condition: user_id for specific users, null for common types
    const query = user_id ? { user_id } : { user_id: null };

    // Check if a document exists
    const existingExpenseTypes =
      await ExpenseTypesModel.findOne<ExpenseTypesDocument>(query);

    if (existingExpenseTypes) {
      // Check for duplicate name in the existing document
      const isDuplicate = existingExpenseTypes.expenseTypeList.some(
        (expenseType) => expenseType.name === payload.name,
      );

      if (isDuplicate) {
        throw new Error(`Expense type '${payload.name}' already exists`);
      }

      // Update existing document by pushing new expense type and return updated document
      const updatedExpenseTypes = await ExpenseTypesModel.findOneAndUpdate(
        query,
        { $push: { expenseTypeList: newExpenseType } },
        { new: true },
      );

      return updatedExpenseTypes;
    } else {
      // Create new document with the expense type
      const newExpenseTypes = await ExpenseTypesModel.create({
        user_id,
        expenseTypeList: [newExpenseType],
      });
      return newExpenseTypes;
    }
  } catch (error: any) {
    console.error('Error in createExpensesType service:', error.message);
    throw new Error(`Failed to create expense type: ${error.message}`);
  }
};
const getAllExpensesType = async (user_id: Types.ObjectId) => {
  try {
    // Find user-specific expense types
    const userExpenseTypes = await ExpenseTypesModel.findOne({ user_id });

    // Find common expense types (where user_id is null)
    const commonExpenseTypes = await ExpenseTypesModel.findOne({
      user_id: null,
    });

    // Initialize result array
    const result = [];

    // Add user-specific expense types to the top of the result array
    if (userExpenseTypes && userExpenseTypes.expenseTypeList) {
      result.push(...userExpenseTypes.expenseTypeList);
    }

    // Add common expense types to the bottom of the result array
    if (commonExpenseTypes && commonExpenseTypes.expenseTypeList) {
      result.push(...commonExpenseTypes.expenseTypeList);
    }

    return result;
  } catch (error: any) {
    console.error('Error in getAllExpensesType service:', error.message);
    throw new Error(`Failed to fetch expense types: ${error.message}`);
  }
};




//===============//=========================== Group Routes ========================


const createOrUpdateExpenseOrIncomeGroup = async (
  user_id: Types.ObjectId,
  payload: {
    groupName?: string;
    groupType?: 'expense' | 'income';
    memberEmails?: string[];
    group_id?: Types.ObjectId;
  },
) => {
  const session = await startSession();
  try {
    session.startTransaction();

    const { groupName, groupType, memberEmails, group_id } = payload;

    // Validate required fields for creation
    if (!group_id) {
      if (!groupName || !groupType || !memberEmails || memberEmails.length === 0) {
        throw new Error('groupName, groupType, and memberEmails are required for creating a group');
      }
      if (!['expense', 'income'].includes(groupType)) {
        throw new Error("groupType must be 'expense' or 'income'");
      }
    }

    // Fetch the creator's profile
    const creatorProfile = await ProfileModel.findOne({ user_id }).session(session);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // For updates, fetch existing group to validate and preserve fields
    let existingGroup = null;
    if (group_id) {
      existingGroup = await ExpenseOrIncomeGroupModel.findOne({ _id: group_id, user_id }).session(session);
      if (!existingGroup) {
        throw new Error('Group not found or you do not have permission to update it');
      }
    }

    // Check group creation limit and duplicates for new groups
    if (!group_id) {
      const totalCreatedGroups = creatorProfile.totalCreatedGroups || 0;
      const maxGroups = creatorProfile.maxGroups || 3;
      if (totalCreatedGroups >= maxGroups) {
        throw new Error('Maximum group creation limit exceeded');
      }

      const existingGroup = await ExpenseOrIncomeGroupModel.findOne({
        user_id,
        groupType,
        groupName,
      }).session(session);
      if (existingGroup) {
        throw new Error(`A ${groupType} group with name '${groupName}' already exists`);
      }
    }

    // Prepare groupMemberList
    let processedMemberList: {
      email: string;
      member_id?: Types.ObjectId | null;
      existOnPlatform?: boolean;
      isInvitationEmailSent?: boolean;
      name?: string;
      isDeleted?: boolean;
    }[] = existingGroup?.groupMemberList || [];

    if (memberEmails && Array.isArray(memberEmails)) {
      // Check for duplicate emails in input
      const uniqueEmails = new Set(memberEmails);
      if (uniqueEmails.size !== memberEmails.length) {
        throw new Error('Duplicate emails are not allowed in memberEmails');
      }

      // Filter out emails already in the group to avoid duplicates
      const existingEmails = new Set(processedMemberList.map((member) => member.email));
      const newEmails = memberEmails.filter((email) => !existingEmails.has(email));

      // Ensure creator's email is included for new groups
      if (!group_id && !newEmails.includes(creatorProfile.email)) {
        newEmails.unshift(creatorProfile.email);
      }

      if (newEmails.length > 0) {
        const newMembers = await Promise.all(
          newEmails.map(async (email) => {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              throw new Error(`Invalid email format: ${email}`);
            }

            const existingProfile = await ProfileModel.findOne({ email }).session(session);
            if (existingProfile) {
              return {
                email,
                member_id: existingProfile.user_id,
                existOnPlatform: true,
                isInvitationEmailSent: false,
                name: existingProfile.name || email,
                isDeleted: false,
              };
            } else {
              const subject = 'Invitation to Join Our App';
              const html = `
                <h1>Welcome to Our App!</h1>
                <p>You have been invited to join our app by a user. You have been included in a ${groupType || existingGroup?.groupType} group: ${groupName || existingGroup?.groupName || 'Unnamed Group'}.</p>
                <p>Please sign up using this email: ${email}</p>
                <a href="${config.App_Download_Url}">Click here to sign up</a>
              `;

              const emailResult = await sendEmail(email, subject, html);
              if (!emailResult.success) {
                throw new Error(`Failed to send invitation email to ${email}`);
              }

              return {
                email,
                member_id: null,
                existOnPlatform: false,
                isInvitationEmailSent: true,
                name: email,
                isDeleted: false,
              };
            }
          }),
        );

        // Append new members to existing list
        processedMemberList = [...processedMemberList, ...newMembers];
      }
    }

    // Prepare update fields
    const updateFields: UpdateFields = {};
    if (groupName) updateFields.groupName = groupName;
    if (groupType) {
      if (!['expense', 'income'].includes(groupType)) {
        throw new Error("groupType must be 'expense' or 'income'");
      }
      updateFields.groupType = groupType;
    }
    if (memberEmails && Array.isArray(memberEmails) && processedMemberList.length > 0) {
      updateFields.groupMemberList = processedMemberList;
    }
    if (!group_id) {
      updateFields.groupType = groupType; // Required for creation
      updateFields.reDistributeAmount = 0; // Schema default
      updateFields.groupMemberList = processedMemberList; // Ensure member list is set for creation
    }

    // Validate required fields for update
    if (group_id && Object.keys(updateFields).length === 0) {
      throw new Error('At least one field (groupName, groupType, or memberEmails) must be provided for update');
    }

    // Check for duplicate groupName during update
    if (group_id && groupName && groupName !== existingGroup?.groupName) {
      const conflictingGroup = await ExpenseOrIncomeGroupModel.findOne({
        user_id,
        groupType: groupType || existingGroup?.groupType,
        groupName,
        _id: { $ne: group_id },
      }).session(session);
      if (conflictingGroup) {
        throw new Error(`A ${groupType || existingGroup?.groupType} group with name '${groupName}' already exists`);
      }
    }

    // Create or update the group
    const query = group_id
      ? { _id: group_id, user_id }
      : { user_id, groupType, groupName };

    const group = await ExpenseOrIncomeGroupModel.findOneAndUpdate(
      query,
      { $set: updateFields },
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    );

    // Update groupList for members with existing profiles
    if (memberEmails && Array.isArray(memberEmails)) {
      await Promise.all(
        processedMemberList
          .filter((member) => member.existOnPlatform && member.member_id)
          .map(async (member) => {
            await ProfileModel.updateOne(
              { user_id: member.member_id },
              { $addToSet: { groupList: group._id } },
              { session },
            );
          }),
      );
    }

    // Increment totalCreatedGroups for new groups
    if (!group_id && group.createdAt === group.updatedAt) {
      await ProfileModel.updateOne(
        { user_id },
        { $inc: { totalCreatedGroups: 1 } },
        { session },
      );
    }

    await session.commitTransaction();
    return group;
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error('Error in createOrUpdateExpenseOrIncomeGroup:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create or update group: ${errorMessage}`);
  } finally {
    session.endSession();
  }
};
const getAllPersonalGroup = async (
  user_id: Types.ObjectId,
  groupName?: string,
  groupType?: 'expense' | 'income',
) => {
  try {
    // Fetch the user's profile to get the groupList
    const profile = await ProfileModel.findOne({ user_id }).select('groupList');
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Build the query for groups based on groupList
    const query: any = { _id: { $in: profile.groupList || [] } };

    // Apply filters if provided
    if (groupName) {
      query.groupName = { $regex: groupName, $options: 'i' }; // Case-insensitive partial match
    }
    if (groupType) {
      query.groupType = groupType;
    }

    // Fetch groups from ExpenseOrIncomeGroupModel
    const groups = await ExpenseOrIncomeGroupModel.find(query).lean();

    return groups;
  } catch (error: unknown) {
    console.error('Error in getAllPersonalGroup:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch groups: ${errorMessage}`);
  }
};
const getSingleGroup = async (
  user_id: Types.ObjectId,
  group_id: Types.ObjectId,
) => {
  if (!user_id || !group_id) {
    throw new Error('user_id and group_id are required');
  }

  // Validate group existence and user membership/ownership
  const group = await ExpenseOrIncomeGroupModel.findOne({
    _id: group_id,
  }).lean();

  if (!group) {
    throw new Error(`Group with id ${group_id} does not exist`);
  }

  // Check if user_id is the owner or in groupMemberList
  const isOwner =
    group.user_id && group.user_id.toString() === user_id.toString();
  const isMember = group.groupMemberList.some(
    (member) =>
      member.member_id &&
      member.member_id.toString() === user_id.toString() &&
      !member.isDeleted,
  );

  if (!isOwner && !isMember) {
    throw new Error(
      `User with id ${user_id} is not the owner or a member of group ${group_id}`,
    );
  }

  // Fetch all transactions for the group
  const transactions = await TransactionModel.find({
    group_id: group_id,
    isGroupTransaction: true,
  }).lean();

  // Calculate contribution of each member
  const contributionMap = new Map<string, number>();

  for (const transaction of transactions) {
    const memberIdOrEmail =
      transaction.spender_id_Or_Email || transaction.earnedBy_id_Or_Email;
    if (memberIdOrEmail) {
      const currentAmount =
        contributionMap.get(memberIdOrEmail.toString()) || 0;
      contributionMap.set(
        memberIdOrEmail.toString(),
        currentAmount + (transaction.amount || 0),
      );
    }
  }

  // Resolve names for contributions
  const contributionOfEachMember = await Promise.all(
    Array.from(contributionMap.entries()).map(
      async ([idOrEmail, totalSpend]) => {
        let name = idOrEmail;

        // Check if idOrEmail is an ObjectId
        if (Types.ObjectId.isValid(idOrEmail)) {
          const profile = await ProfileModel.findOne({
            _id: idConverter(idOrEmail),
          }).lean();
          if (profile && profile.name) {
            name = profile.name;
          }
        }

        return {
          name,
          totalSpend,
        };
      },
    ),
  );

  return {
    groupDetail: group,
    contributionOfEachMember,
    transactions: transactions || [],
  };
};
const leaveGroupOrKickOut = async (
  user_id: Types.ObjectId,
  member_id: Types.ObjectId,
  group_id: Types.ObjectId,
) => {
  const session = await startSession();
  try {
    session.startTransaction();

    // Fetch the group by group_id
    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: group_id,
    }).session(session);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user_id is the group owner
    const isOwner = user_id.equals(group.user_id);

    // Case 1: user_id equals member_id (user is trying to leave)
    if (user_id.equals(member_id)) {
      if (isOwner) {
        throw new Error("A group owner can't leave or be  deleted");
      }
    }
    // Case 2: user_id does not equal member_id (user is trying to kick out another member)
    else {
      if (!isOwner) {
        throw new Error('Only group owner can remove a member');
      }
    }

    // Find the member in groupMemberList
    const memberIndex = group.groupMemberList.findIndex(
      (member) => member.member_id && member.member_id.equals(member_id),
    );
    if (memberIndex === -1) {
      throw new Error('Member not found in group');
    }

    // Mark the member as deleted
    group.groupMemberList[memberIndex].isDeleted = true;

    // Save the updated group
    await group.save({ session });

    // Remove the group_id from the member's groupList in ProfileModel
    await ProfileModel.updateOne(
      { user_id: member_id },
      { $pull: { groupList: group_id } },
      { session },
    );

    await session.commitTransaction();
    return { success: true, message: 'Member removed from group successfully' };
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error('Error in leaveGroupOrKickOut:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to remove member from group: ${errorMessage}`);
  } finally {
    session.endSession();
  }
};





const deleteGroup = async (
  user_id: Types.ObjectId,
  group_id: Types.ObjectId,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const groupUpdateResult = await ExpenseOrIncomeGroupModel.updateOne(
      { _id: group_id, user_id },
      { $set: { isDeleted: true } },
      { session },
    );

    if (groupUpdateResult.modifiedCount === 0) {
      throw new Error(
        'Group not found or you are not authorized to delete this group',
      );
    }

    const profileUpdateResult = await ProfileModel.updateOne(
      { user_id },
      {
        $pull: { groupList: group_id },
        $inc: { totalCreatedGroups: -1 },
      },
      { session },
    );

    if (profileUpdateResult.modifiedCount === 0) {
      throw new Error('Failed to update user profile after group deletion');
    }

    await session.commitTransaction();
    session.endSession();

    return { success: true, message: 'Group deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const addIncomeOrExpenses = async (user_id: Types.ObjectId, payload: any) => {
  if (!user_id) {
    throw new Error('User ID is required to add income or expenses');
  }

  const {
    transactionType,
    currency,
    date,
    description,
    type_id,
    isGroupTransaction,
    group_id,
    distribution_type,
    distributionAmong,
    isRedistribute,
  } = payload;
  let amount = payload.amount || 0; // Default to 0 if not provided

  // Validate required fields (description optional for expenses)
  if (!transactionType || !currency || !date || !type_id) {
    throw new Error(
      'transactionType, currency, date, and type_id are required',
    );
  }

  if (transactionType === transactionTypeConst.income && !description) {
    throw new Error('description is required for income transactions');
  }

  // Validate type_id existence
  let isTypeExist;
  if (transactionType === transactionTypeConst.expense) {
    isTypeExist = await ExpenseTypesModel.findOne({
      user_id: { $in: [user_id, null] },
      'expenseTypeList._id': idConverter(type_id),
    });
  } else {
    isTypeExist = await IncomeTypesModel.findOne({
      user_id: { $in: [user_id, null] },
      'incomeTypeList._id': idConverter(type_id),
    });
  }
  if (!isTypeExist) {
    throw new Error(
      `Type with id ${type_id} does not exist for user ${user_id}`,
    );
  }

  // Prepare transactions
  const transactions = [];

  if (!isGroupTransaction) {
    // Personal transaction: use user_id for spender_id_Or_Email or earnedBy_id_Or_Email
    if (!amount) {
      throw new Error('amount is required for non-group transactions');
    }
    const transactionData = {
      transactionType,
      currency,
      date,
      amount,
      distribution_type: null,
      description,
      type_id: idConverter(type_id) as Types.ObjectId,
      user_id,
      isGroupTransaction: false,
      group_id: null,
      typeModel:
        transactionType === transactionTypeConst.expense
          ? 'TPersonalExpenseTypes'
          : 'TPersonalIncomeTypes',
      spender_id_Or_Email:
        transactionType === transactionTypeConst.expense ? user_id : null,
      earnedBy_id_Or_Email:
        transactionType === transactionTypeConst.income ? user_id : null,
    };
    transactions.push(transactionData);
  } else {
    // Group transaction: validate group and create transactions for each member
    if (!group_id) {
      throw new Error('group_id is required for group transactions');
    }
    if (!distribution_type) {
      throw new Error('distribution_type is required for group transactions');
    }

    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: idConverter(group_id),
      user_id: user_id,
      // groupType: transactionType,
    });

    if (!group) {
      throw new Error(
        `Group with id ${group_id} does not exist or does not match transaction type or you are not owner of this group cant modify it`,
      );
    }

    // If isRedistribute is true, use reDistributeAmount from group
    if (isRedistribute) {
      if (
        group.reDistributeAmount === undefined ||
        group.reDistributeAmount === 0
      ) {
        throw new Error(
          'No reDistributeAmount available in the group for redistribution',
        );
      }
      amount = group.reDistributeAmount;
    }

    let membersToDistribute: Array<{ memberEmail: string; amount?: number }> =
      [];

    // Filter out deleted members
    const activeMembers = group.groupMemberList.filter(
      (member) => !member.isDeleted,
    );

    if (distribution_type === 'equal') {
      if (!amount) {
        throw new Error('amount is required for equal distribution');
      }
      // If distributionAmong is not provided or empty, use all active group members
      if (!distributionAmong || distributionAmong.length === 0) {
        membersToDistribute = activeMembers.map((member) => ({
          memberEmail: member.email,
        }));
      } else {
        // Validate provided memberEmails against active members
        const groupMemberEmails = activeMembers.map((member) => member.email);
        const invalidEmails = distributionAmong.filter(
          (member: { memberEmail: string }) =>
            !groupMemberEmails.includes(member.memberEmail),
        );
        if (invalidEmails.length > 0) {
          throw new Error(
            `Invalid member emails in distributionAmong: ${invalidEmails
              .map((m: { memberEmail: string }) => m.memberEmail)
              .join(', ')}`,
          );
        }
        membersToDistribute = distributionAmong.map(
          (member: { memberEmail: string }) => ({
            memberEmail: member.memberEmail,
          }),
        );
      }
      // Calculate equal amount per member
      const amountPerMember = amount / membersToDistribute.length;
      membersToDistribute = membersToDistribute.map((member) => ({
        ...member,
        amount: amountPerMember,
      }));
    } else if (distribution_type === 'custom') {
      // Require distributionAmong with spentAmount
      if (!distributionAmong || distributionAmong.length === 0) {
        throw new Error(
          'distributionAmong with spentAmount is required for custom distribution',
        );
      }
      // Validate spentAmount and memberEmails
      for (const member of distributionAmong) {
        if (!member.memberEmail) {
          throw new Error(
            'memberEmail is required for each member in distributionAmong',
          );
        }
        if (typeof member.spentAmount !== 'number' || member.spentAmount < 0) {
          throw new Error(
            `Invalid or missing spentAmount for member ${member.memberEmail}`,
          );
        }
      }
      const groupMemberEmails = activeMembers.map((member) => member.email);
      const invalidEmails = distributionAmong.filter(
        (member: { memberEmail: string }) =>
          !groupMemberEmails.includes(member.memberEmail),
      );
      if (invalidEmails.length > 0) {
        throw new Error(
          `Invalid member emails in distributionAmong: ${invalidEmails
            .map((m: { memberEmail: string }) => m.memberEmail)
            .join(', ')}`,
        );
      }
      // Calculate total amount if not provided
      if (!amount) {
        amount = distributionAmong.reduce(
          (sum: number, member: { spentAmount: number }) =>
            sum + member.spentAmount,
          0,
        );
      } else {
        // Validate total spentAmount matches provided amount
        const totalSpentAmount = distributionAmong.reduce(
          (sum: number, member: { spentAmount: number }) =>
            sum + member.spentAmount,
          0,
        );
        if (totalSpentAmount !== amount) {
          throw new Error(
            `Total spentAmount (${totalSpentAmount}) does not match transaction amount (${amount})`,
          );
        }
      }
      membersToDistribute = distributionAmong.map(
        (member: { memberEmail: string; spentAmount: number }) => ({
          memberEmail: member.memberEmail,
          amount: member.spentAmount,
        }),
      );
    } else {
      throw new Error('Invalid distribution_type: must be "equal" or "custom"');
    }

    // Create a transaction for each member
    for (const member of membersToDistribute) {
      const groupMember = activeMembers.find(
        (m) => m.email === member.memberEmail,
      );
      const idOrEmail = groupMember?.member_id || member.memberEmail;

      const transactionData = {
        transactionType,
        currency,
        date,
        amount: member.amount || 0,
        distribution_type,
        description,
        type_id: idConverter(type_id) as Types.ObjectId,
        user_id,
        isGroupTransaction: true,
        group_id: idConverter(group_id) as Types.ObjectId,
        typeModel:
          transactionType === transactionTypeConst.expense
            ? 'TPersonalExpenseTypes'
            : 'TPersonalIncomeTypes',
        spender_id_Or_Email:
          transactionType === transactionTypeConst.expense ? idOrEmail : null,
        earnedBy_id_Or_Email:
          transactionType === transactionTypeConst.income ? idOrEmail : null,
      };
      transactions.push(transactionData);
    }

    // If redistribution was used, reset reDistributeAmount to 0
    if (isRedistribute) {
      group.reDistributeAmount = 0;
      await group.save();
    }
  }

  console.log('Transactions to be saved:', transactions);

  // Create transactions using TransactionModel
  const result = await TransactionModel.insertMany(transactions);
  return result;
};



const getIndividualExpenseOrIncome = async (
  user_id: Types.ObjectId,
  incomeOrExpense_id: Types.ObjectId,
) => {
  if (!user_id || !incomeOrExpense_id) {
    throw new Error('user_id and incomeOrExpense_id are required');
  }

  // Fetch the transaction
  const transaction = await TransactionModel.findOne({
    _id: incomeOrExpense_id,
  }).lean();

  if (!transaction) {
    throw new Error(`Transaction with id ${incomeOrExpense_id} does not exist`);
  }

  // Check user access based on transaction type
  if (!transaction.isGroupTransaction) {
    // Non-group transaction: verify user_id matches
    if (transaction.user_id.toString() !== user_id.toString()) {
      throw new Error(
        `User with id ${user_id} is not authorized to access this transaction`,
      );
    }
  } else {
    // Group transaction: verify user is in groupMemberList
    if (!transaction.group_id) {
      throw new Error('Group transaction is missing group_id');
    }

    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: transaction.group_id,
    }).lean();

    if (!group) {
      throw new Error(`Group with id ${transaction.group_id} does not exist`);
    }

    // Check if user_id is the owner or in groupMemberList
    const isOwner =
      group.user_id && group.user_id.toString() === user_id.toString();
    const isMember = group.groupMemberList.some(
      (member) =>
        member.member_id &&
        member.member_id.toString() === user_id.toString() &&
        !member.isDeleted,
    );

    if (!isOwner && !isMember) {
      throw new Error(
        `User with id ${user_id} is not the owner or a member of group ${transaction.group_id}`,
      );
    }
  }

  return transaction;
};
const modifyIncomeOrExpenses = async (
  user_id: Types.ObjectId,
  incomeOrExpense_id: Types.ObjectId,
  payload: any,
) => {
  if (!user_id || !incomeOrExpense_id) {
    throw new Error('user_id and incomeOrExpense_id are required');
  }

  // Fetch the existing transaction
  const transaction = await TransactionModel.findOne({
    _id: incomeOrExpense_id,
  });

  if (!transaction) {
    throw new Error(`Transaction with id ${incomeOrExpense_id} does not exist`);
  }

  // Verify user permission
  if (!transaction.isGroupTransaction) {
    // Non-group transaction: check if user_id matches
    if (transaction.user_id.toString() !== user_id.toString()) {
      throw new Error(
        `User with id ${user_id} is not authorized to modify this transaction`,
      );
    }
  } else {
    // Group transaction: verify user is the owner of the group
    if (!transaction.group_id) {
      throw new Error('Group transaction is missing group_id');
    }

    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: transaction.group_id,
    });

    if (!group) {
      throw new Error(`Group with id ${transaction.group_id} does not exist`);
    }

    const isOwner =
      group.user_id && group.user_id.toString() === user_id.toString();

    if (!isOwner) {
      throw new Error(
        `User with id ${user_id} is not the owner of group ${transaction.group_id}`,
      );
    }
  }

  // Validate and extract allowed fields from payload
  const { amount, date, description, currency } = payload;
  const updateData: any = {};

  // Validate and add allowed fields to updateData
  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    updateData.amount = amount;
  }
  if (date !== undefined) {
    if (typeof date !== 'string') {
      throw new Error('Date must be a string');
    }
    updateData.date = date;
  }
  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new Error('Description must be a string');
    }
    // Ensure description is provided for income transactions
    if (transaction.transactionType === 'income' && !description) {
      throw new Error('Description is required for income transactions');
    }
    updateData.description = description;
  }
  if (currency !== undefined) {
    if (typeof currency !== 'string') {
      throw new Error('Currency must be a string');
    }
    updateData.currency = currency;
  }

  // If no fields to update, throw an error
  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields provided to update');
  }

  // Handle group transaction amount redistribution
  if (transaction.isGroupTransaction && amount !== undefined) {
    // Calculate the difference for group transaction
    const oldAmount = transaction.amount || 0;
    const amountDifference = amount - oldAmount;

    // Update reDistributeAmount in the group
    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: transaction.group_id,
    });

    if (group) {
      // If amount increases, others pay less (negative reDistributeAmount)
      // If amount decreases, others pay more (positive reDistributeAmount)
      const reDistributeAmount = group.reDistributeAmount || 0;
      group.reDistributeAmount = reDistributeAmount - amountDifference;

      await group.save();
    }
  }

  // Update the transaction
  const updatedTransaction = await TransactionModel.findOneAndUpdate(
    { _id: incomeOrExpense_id },
    { $set: updateData },
    { new: true },
  ).lean();

  if (!updatedTransaction) {
    throw new Error('Failed to update transaction');
  }

  return updatedTransaction;
};
const getAllIncomeAndExpenses = async (
  user_id: Types.ObjectId,
  transactionType?: 'income' | 'expense' | undefined,
  userEmail?: string, // Optional parameter to match email in spender_id_Or_Email or earnedBy_id_Or_Email
  type_id?: Types.ObjectId, // Optional type_id parameter
  group_id?: Types.ObjectId // Optional group_id parameter
) => {
  if (!user_id) {
    throw new Error('User ID is required to fetch income and expenses');
  }

  // Build the query
  const query: any = { user_id };

  // Add type_id to the query if provided
  if (type_id) {
    query.type_id = type_id;
  }

  // Add group_id to the query if provided
  if (group_id) {
    query.group_id = group_id;
  }

  // If transactionType is provided, add it to the query
  if (transactionType) {
    query.transactionType = transactionType;
    // Match spender_id_Or_Email for expenses or earnedBy_id_Or_Email for income
    const field = transactionType === 'expense' ? 'spender_id_Or_Email' : 'earnedBy_id_Or_Email';
    query[field] = {
      $in: [user_id, ...(userEmail ? [userEmail] : [])], // Match either user_id or userEmail
    };
  } else {
    // If no transactionType, match either spender_id_Or_Email or earnedBy_id_Or_Email
    query.$or = [
      {
        transactionType: 'expense',
        spender_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] },
      },
      {
        transactionType: 'income',
        earnedBy_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] },
      },
    ];
  }

  // Fetch transactions
  const transactions = await TransactionModel.find(query)
    .sort({ date: -1 }) // Sort by date descending (most recent first)
    .lean();

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Create transactions list (includes both expenses and income, sorted by date)
  const transactionsList = transactions.map((t) => ({
    _id: t._id,
    amount: t.amount,
    currency: t.currency,
    date: t.date,
    description: t.description,
    transactionType: t.transactionType,
    distribution_type: t.distribution_type,
    type_id: t.type_id,
    isGroupTransaction: t.isGroupTransaction,
    group_id: t.group_id,
    spender_id_Or_Email: t.spender_id_Or_Email,
    earnedBy_id_Or_Email: t.earnedBy_id_Or_Email,
  }));

return transactionType === "income"
  ? { totalIncome: Number(totalIncome) || 0, transactionsList: transactionsList || [] }
  : transactionType === "expense"
  ? { totalExpenses: Number(totalExpenses) || 0, transactionsList: transactionsList || [] }
  : {
      totalIncome: Number(totalIncome) || 0,
      totalExpenses: Number(totalExpenses) || 0,
      remainingBalance: Number(totalIncome) - Number(totalExpenses) || 0,
      transactionsList: transactionsList || [],
    };
};





const incomeAndExpensesService = {
  createIncomeType,
  createExpensesType,
  getAllIncomeType,
  getAllExpensesType,
  createOrUpdateExpenseOrIncomeGroup,
  addIncomeOrExpenses,
  getAllPersonalGroup,
  leaveGroupOrKickOut,
  deleteGroup,
  getSingleGroup,
  getIndividualExpenseOrIncome,
  modifyIncomeOrExpenses,
  getAllIncomeAndExpenses
};

export default incomeAndExpensesService;
