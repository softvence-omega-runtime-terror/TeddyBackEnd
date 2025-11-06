import mongoose, { ClientSession, startSession, Types } from 'mongoose';
import {
  ExpenseTypesModel,
  IncomeTypesModel,
  TransactionModel,
  ExpenseOrIncomeGroupModel,
  GroupsEachTransactionSummaryModel,
} from './incomeAndexpence.model';
import { uploadImgToCloudinary } from '../../util/uploadImgToCludinary';
import { transactionTypeConst } from '../../constants';
import { sendEmail } from '../../util/sendEmail';
import { CategoryModel, ProfileModel } from '../user/user.model';
import config from '../../config';
import generateTransactionCode from '../../util/transactionCodeGenarator';
import { RecurringTransactionModel, TRecurringUnit } from './recurringTransaction.model';
import { convertCurrency, convertCurrencyBatch, TCurrency } from '../../util/currencyConverter';

// ADDED: Helper function to check if a value is a valid ObjectId
const isValidObjectId = (str: string | Types.ObjectId): boolean => {
  return Types.ObjectId.isValid(str);
};

interface MemberContribution {
  name: string;
  totalExpenses: number;
  totalIncome: number;
}
interface GroupResponse {
  groupDetail: any; // Adjust based on your TExpenseOrIncomeGroup type
  totalExpenses: number;
  totalIncome: number;
  contributionOfEachMember: MemberContribution[];
  transactions: any[]; // Adjust based on your Transaction type
}
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
interface DistributionMember {
  memberEmail: string;
  spentOrEarnedAmount?: number;
}
interface Payload {
  slice_type: 'equal' | 'custom';
  distributionAmong: DistributionMember[];
  isDiscard?: boolean;
}

//.................//...........///..................//...........///.
//========================================================================= Income Type Service ========================



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
      const fileSource: string | Buffer = file.buffer || file.path;
      const uploadResult = await uploadImgToCloudinary(imageName, fileSource);
      imageUrl = (uploadResult as any).secure_url;
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
      const fileSource: string | Buffer = file.buffer || file.path;
      const uploadResult = await uploadImgToCloudinary(imageName, fileSource);
      imageUrl = (uploadResult as any).secure_url;
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
    console.log('Fetching expense types for user_id:', user_id);
    // Find user-specific expense types
    const userExpenseTypes = await ExpenseTypesModel.findOne({ user_id });

    console.log('User-specific expense types:', userExpenseTypes);

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

// Update Income Type Service
const updateIncomeType = async (user_id: Types.ObjectId, typeId: string, payload: any, file: any) => {
  try {
    const query = user_id ? { user_id } : { user_id: null };
    const doc = await IncomeTypesModel.findOne(query);
    if (!doc) throw new Error('Income type document not found');
    const idx = doc.incomeTypeList.findIndex((t: any) => t._id.toString() === typeId);
    if (idx === -1) throw new Error('Income type not found');
    if (payload.name) doc.incomeTypeList[idx].name = payload.name;
    if (file) {
      const imageName = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}`;
      const fileSource: string | Buffer = file.buffer || file.path;
      const uploadResult = await uploadImgToCloudinary(imageName, fileSource);
      doc.incomeTypeList[idx].img = (uploadResult as any).secure_url;
    }
    await doc.save();
    return doc;
  } catch (error: any) {
    console.error('Error in updateIncomeType service:', error.message);
    throw new Error(`Failed to update income type: ${error.message}`);
  }
};

// Delete Income Type Service
const deleteIncomeType = async (user_id: Types.ObjectId, typeId: string) => {
  try {
    const query = user_id ? { user_id } : { user_id: null };
    const doc = await IncomeTypesModel.findOne(query);
    if (!doc) throw new Error('Income type document not found');
    const idx = doc.incomeTypeList.findIndex((t: any) => t._id.toString() === typeId);
    if (idx === -1) throw new Error('Income type not found');
    doc.incomeTypeList.splice(idx, 1);
    await doc.save();
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteIncomeType service:', error.message);
    throw new Error(`Failed to delete income type: ${error.message}`);
  }
};

// Update Expenses Type Service
const updateExpensesType = async (user_id: Types.ObjectId, typeId: string, payload: any, file: any) => {
  try {
    const query = user_id ? { user_id } : { user_id: null };
    const doc = await ExpenseTypesModel.findOne(query);
    if (!doc) throw new Error('Expenses type document not found');
    const idx = doc.expenseTypeList.findIndex((t: any) => t._id.toString() === typeId);
    if (idx === -1) throw new Error('Expenses type not found');
    if (payload.name) doc.expenseTypeList[idx].name = payload.name;
    if (file) {
      const imageName = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}`;
      const fileSource: string | Buffer = file.buffer || file.path;
      const uploadResult = await uploadImgToCloudinary(imageName, fileSource);
      doc.expenseTypeList[idx].img = (uploadResult as any).secure_url;
    }
    await doc.save();
    return doc;
  } catch (error: any) {
    console.error('Error in updateExpensesType service:', error.message);
    throw new Error(`Failed to update expenses type: ${error.message}`);
  }
};

// Delete Expenses Type Service
const deleteExpensesType = async (user_id: Types.ObjectId, typeId: string) => {
  try {
    const query = user_id ? { user_id } : { user_id: null };
    const doc = await ExpenseTypesModel.findOne(query);
    if (!doc) throw new Error('Expenses type document not found');
    const idx = doc.expenseTypeList.findIndex((t: any) => t._id.toString() === typeId);
    if (idx === -1) throw new Error('Expenses type not found');
    doc.expenseTypeList.splice(idx, 1);
    await doc.save();
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteExpensesType service:', error.message);
    throw new Error(`Failed to delete expenses type: ${error.message}`);
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
      if (
        !groupName ||
        !groupType ||
        !memberEmails ||
        memberEmails.length === 0
      ) {
        throw new Error(
          'groupName, groupType, and memberEmails are required for creating a group',
        );
      }
      if (!['expense', 'income'].includes(groupType)) {
        throw new Error("groupType must be 'expense' or 'income'");
      }
    }

    // Fetch the creator's profile
    const creatorProfile = await ProfileModel.findOne({ user_id }).session(
      session,
    );
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // For updates, fetch existing group to validate and preserve fields
    let existingGroup = null;
    if (group_id) {
      existingGroup = await ExpenseOrIncomeGroupModel.findOne({
        _id: group_id,
        user_id,
      }).session(session);
      if (!existingGroup) {
        throw new Error(
          'Group not found or you do not have permission to update it',
        );
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
        throw new Error(
          `A ${groupType} group with name '${groupName}' already exists`,
        );
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
      const existingEmails = new Set(
        processedMemberList.map((member) => member.email),
      );
      const newEmails = memberEmails.filter(
        (email) => !existingEmails.has(email),
      );

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

            const existingProfile = await ProfileModel.findOne({
              email,
            }).session(session);
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
    if (
      memberEmails &&
      Array.isArray(memberEmails) &&
      processedMemberList.length > 0
    ) {
      updateFields.groupMemberList = processedMemberList;
    }
    if (!group_id) {
      updateFields.groupType = groupType; // Required for creation
      updateFields.reDistributeAmount = 0; // Schema default
      updateFields.groupMemberList = processedMemberList; // Ensure member list is set for creation
    }

    // Validate required fields for update
    if (group_id && Object.keys(updateFields).length === 0) {
      throw new Error(
        'At least one field (groupName, groupType, or memberEmails) must be provided for update',
      );
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
        throw new Error(
          `A ${groupType || existingGroup?.groupType} group with name '${groupName}' already exists`,
        );
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
    if (!group_id) {
      const updateResult = await ProfileModel.updateOne(
        { user_id },
        { $inc: { totalCreatedGroups: 1 } },
        { session },
      );
      console.log('Increment totalCreatedGroups result:', updateResult, 'user_id:', user_id);
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

  const group = await ExpenseOrIncomeGroupModel.findOne({
    _id: group_id,
  }).lean();

  if (!group) {
    throw new Error(`Group with id ${group_id} does not exist`);
  }

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

  const summaries = await GroupsEachTransactionSummaryModel.find({
    fractionalTransaction_id: { $exists: true },
  })
    .populate('fractionalTransaction_id')
    .lean();

  let totalExpenses = 0;
  let totalIncome = 0;
  const contributionMap = new Map<
    string,
    { totalExpenses: number; totalIncome: number }
  >();

  const filteredSummaries = summaries.filter((summary) =>
    (summary.fractionalTransaction_id as any[]).some(
      (transaction) => transaction.group_id.toString() === group_id.toString(),
    ),
  );

  for (const summary of filteredSummaries) {
    const transactions = summary.fractionalTransaction_id as any[];
    if (Array.isArray(transactions)) {
      for (const transaction of transactions) {
        if (transaction.group_id.toString() !== group_id.toString()) continue;

        const memberIdOrEmail =
          transaction.transactionType === 'expense'
            ? transaction.spender_id_Or_Email
            : transaction.earnedBy_id_Or_Email;

        if (memberIdOrEmail) {
          const key = memberIdOrEmail.toString();
          const current = contributionMap.get(key) || {
            totalExpenses: 0,
            totalIncome: 0,
          };

          if (transaction.transactionType === 'expense') {
            totalExpenses += transaction.amount || 0;
            current.totalExpenses += transaction.amount || 0;
          } else if (transaction.transactionType === 'income') {
            totalIncome += transaction.amount || 0;
            current.totalIncome += transaction.amount || 0;
          }

          contributionMap.set(key, current);
        }
      }
    }
  }

  const contributionOfEachMember = Array.from(contributionMap.entries()).map(
    ([idOrEmail, { totalExpenses, totalIncome }]) => {
      const member = group.groupMemberList.find(
        (m) =>
          m.email === idOrEmail ||
          (m.member_id && m.member_id.toString() === idOrEmail),
      );
      const name = member ? member.name || member.email : idOrEmail;

      return {
        name,
        totalExpenses,
        totalIncome,
      };
    },
  );

  const transformedSummaries = await Promise.all(
    filteredSummaries.map(async (summary) => {
      const transactions = summary.fractionalTransaction_id as any[];
      const type_id = transactions.length > 0 ? transactions[0].type_id : null;
      const transactionType = transactions.length > 0 ? transactions[0].transactionType : null;

      let type_name = null;
      if (type_id && transactionType) {
        if (transactionType === 'expense') {
          const expenseType = await ExpenseTypesModel.findOne({
            user_id: { $in: [user_id, null] },
            'expenseTypeList._id': type_id,
          }).lean();
          if (expenseType) {
            const type = expenseType.expenseTypeList.find(
              (t: any) => t._id.toString() === type_id.toString(),
            );
            type_name = type ? type.name : null;
          }
        } else if (transactionType === 'income') {
          const incomeType = await IncomeTypesModel.findOne({
            user_id: { $in: [user_id, null] },
            'incomeTypeList._id': type_id,
          }).lean();
          if (incomeType) {
            const type = incomeType.incomeTypeList.find(
              (t: any) => t._id.toString() === type_id.toString(),
            );
            type_name = type ? type.name : null;
          }
        }
      }

      const contribution = summary.members_Share_list.map((share, index) => {
        const memberEmail = share.member_email.toString();
        const member = group.groupMemberList.find(
          (m) =>
            m.email === memberEmail ||
            (m.member_id && m.member_id.toString() === memberEmail),
        );
        const name = member ? member.name || member.email : memberEmail;

        const contributionEntry = summary.contribution_list[index];
        const transaction = transactions.find(
          (t) =>
            (t.transactionType === 'expense'
              ? t.spender_id_Or_Email
              : t.earnedBy_id_Or_Email
            ).toString() === memberEmail,
        );

        return {
          name,
          oughtToPay: share.share_amount,
          paied: contributionEntry ? contributionEntry.contributed_amount : 0,
          lendOrBorrowed: transaction ? transaction.borrowedOrLendAmount || 0 : 0,
          transaction_id: transaction ? transaction._id : null,
        };
      });

      return {
        amount: summary.amount,
        type_name,
        contribution,
      };
    }),
  );

  return {
    groupDetail: group,
    totalExpenses,
    totalIncome,
    contributionOfEachMember,
    transactionSummaries: transformedSummaries,
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



//===============//=========================== Transaction Routes ========================

// Helper function to safely convert to ObjectId
const safeIdConverter = (id: string | Types.ObjectId): Types.ObjectId => {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
};

const addIncomeOrExpenses = async (user_id: Types.ObjectId, payload: any) => {
  // Allow repeat creation pass-through: if payload.repeat provided, create schedule and also create first occurrence now
  // repeat: { every: number, unit: 'minute'|'hour'|'day'|'week'|'month', endAt?: string, maxOccurrences?: number, startAt?: string }
  const maybeRepeat = payload?.repeat;
  if (maybeRepeat && typeof maybeRepeat === 'object') {
    // Helpers to support presets
    const parseTime = (t?: string) => {
      const [hh, mm] = (t || '00:00').split(':').map((v) => parseInt(v, 10));
      return { hh: isNaN(hh) ? 0 : hh, mm: isNaN(mm) ? 0 : mm };
    };
    const toUtcFromLocal = (y: number, m: number, d: number, hh: number, mm: number, tzOffsetMinutes?: number) => {
      const local = new Date(y, m, d, hh, mm, 0, 0);
      if (typeof tzOffsetMinutes === 'number') {
        return new Date(local.getTime() - tzOffsetMinutes * 60 * 1000);
      }
      return new Date(Date.UTC(y, m, d, hh, mm, 0, 0));
    };
    const nextWeeklyAt = (weekday: number, time?: string, tzOffsetMinutes?: number) => {
      const now = new Date();
      const { hh, mm } = parseTime(time);
      const candidateLocal = new Date(now);
      candidateLocal.setHours(hh, mm, 0, 0);
      let diff = (weekday - candidateLocal.getDay() + 7) % 7;
      if (diff === 0 && candidateLocal <= now) diff = 7;
      const targetLocal = new Date(candidateLocal);
      targetLocal.setDate(candidateLocal.getDate() + diff);
      return toUtcFromLocal(
        targetLocal.getFullYear(),
        targetLocal.getMonth(),
        targetLocal.getDate(),
        targetLocal.getHours(),
        targetLocal.getMinutes(),
        (maybeRepeat as any).tzOffsetMinutes,
      );
    };
    const nextMonthlyAt = (dayOfMonth: number, time?: string, tzOffsetMinutes?: number) => {
      const now = new Date();
      const { hh, mm } = parseTime(time);
      const dom = Math.max(1, Math.min(28, dayOfMonth));
      let y = now.getFullYear();
      let m = now.getMonth();
      let candidate = toUtcFromLocal(y, m, dom, hh, mm, tzOffsetMinutes);
      if (candidate <= now) {
        m += 1; if (m > 11) { m = 0; y += 1; }
        candidate = toUtcFromLocal(y, m, dom, hh, mm, tzOffsetMinutes);
      }
      return candidate;
    };
    const addUnit = (d: Date, count: number, u: TRecurringUnit) => {
      const x = new Date(d);
      if (u === 'minute') x.setMinutes(x.getMinutes() + count);
      else if (u === 'hour') x.setHours(x.getHours() + count);
      else if (u === 'day') x.setDate(x.getDate() + count);
      else if (u === 'week') x.setDate(x.getDate() + 7 * count);
      else if (u === 'month') x.setMonth(x.getMonth() + count);
      return x;
    };

    let every: number = 1;
    let unit: TRecurringUnit = 'day';
    let startDate: Date = new Date();
    const { endAt, maxOccurrences } = maybeRepeat as any;

    if ('preset' in maybeRepeat) {
      const preset = (maybeRepeat as any).preset as 'weekly' | 'monthly';
      const time = (maybeRepeat as any).time as string | undefined;
      const tzOffsetMinutes = (maybeRepeat as any).tzOffsetMinutes as number | undefined;
      if (preset === 'weekly') {
        const weekday = (maybeRepeat as any).weekday as number; // 0..6, 0=Sunday
        if (typeof weekday !== 'number' || weekday < 0 || weekday > 6) {
          throw new Error('repeat.weekday must be 0..6 for preset=weekly');
        }
        startDate = nextWeeklyAt(weekday, time, tzOffsetMinutes);
        unit = 'week';
        every = 1;
      } else if (preset === 'monthly') {
        const dayOfMonth = (maybeRepeat as any).dayOfMonth as number;
        if (typeof dayOfMonth !== 'number' || dayOfMonth < 1 || dayOfMonth > 31) {
          throw new Error('repeat.dayOfMonth must be 1..31 for preset=monthly');
        }
        startDate = nextMonthlyAt(dayOfMonth, time, tzOffsetMinutes);
        unit = 'month';
        every = 1;
      } else {
        throw new Error('repeat.preset must be weekly or monthly');
      }
    } else {
      const direct = maybeRepeat as { every: number; unit: TRecurringUnit; startAt?: string };
      if (!direct.every || !direct.unit) {
        throw new Error('repeat.every and repeat.unit are required when setting up a repeating transaction');
      }
      if (!['minute', 'hour', 'day', 'week', 'month'].includes(direct.unit)) {
        throw new Error('repeat.unit must be one of minute|hour|day|week|month');
      }
      every = direct.every;
      unit = direct.unit;
      startDate = direct.startAt ? new Date(direct.startAt) : new Date();
    }

    const nextRunAt = addUnit(startDate, every, unit);
    await RecurringTransactionModel.create({
      user_id,
      basePayload: { ...payload, repeat: undefined },
      every,
      unit,
      startAt: startDate,
      nextRunAt,
      endAt: endAt ? new Date(endAt) : null,
      maxOccurrences: typeof maxOccurrences === 'number' ? maxOccurrences : null,
      runCount: 0,
      isActive: true,
    });

    const { repeat, ...cleanPayload } = payload;
    payload = cleanPayload;
  }
  if (!user_id) {
    throw new Error('User ID is required to add income or expenses');
  }

  // Fetch user profile to get preferred currency
  const userProfile = await ProfileModel.findOne({ user_id, isDeleted: false }).lean();
  const userCurrency: TCurrency = (userProfile?.preferredCurrency as TCurrency) || 'USD';

  const {
    transactionType,
    currency: payloadCurrency, // This might be undefined, we'll use userCurrency
    date,
    description,
    type_id,
    isGroupTransaction,
    group_id,
    shareWith,
    perticipated_members,
    slice_type,
    members_Share_list,
    contribution_type,
    contribution_list,
    amount: payloadAmount,
  } = payload;

  // Use user's preferred currency if not provided in payload
  const currency = payloadCurrency || userCurrency;

  let amount = payloadAmount || 0;
  const effectiveDate = date || new Date().toISOString();

  if (!transactionType || (!maybeRepeat && !date) || !type_id) {
    throw new Error('transactionType and type_id are required; date is required unless repeat is provided');
  }

  if (transactionType === transactionTypeConst.income && !description) {
    throw new Error('description is required for income transactions');
  }

  let isTypeExist;
  if (transactionType === transactionTypeConst.expense) {
    isTypeExist = await CategoryModel.findOne({
      user_id: { $in: [user_id, null] },
      '_id': safeIdConverter(type_id),
    });
  } else {
    isTypeExist = await CategoryModel.findOne({
      user_id: { $in: [user_id, null] },
      '_id': safeIdConverter(type_id),
    });
  }
  if (!isTypeExist) {
    throw new Error(`Type with id ${type_id} does not exist for user ${user_id}`);
  }

  const transaction_Code = await generateTransactionCode(
    user_id,
    isGroupTransaction ? safeIdConverter(group_id) : undefined,
  );

  const transactions = [];

  if (!isGroupTransaction || shareWith === 'none') {
    if (!amount) {
      throw new Error('amount is required for non-group transactions');
    }
    const transactionData = {
      transactionType,
      transaction_Code,
      currency,
      date: effectiveDate,
      amount,
      inDebt: false,
      borrowedOrLendAmount: 0,
      description,
      type_id: safeIdConverter(type_id) as Types.ObjectId,
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
    if (!group_id) {
      throw new Error('group_id is required for group transactions');
    }

    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: safeIdConverter(group_id),
      user_id: user_id,
    });

    if (!group) {
      throw new Error(
        `Group with id ${group_id} does not exist or does not match transaction type or you are not owner of this group cant modify it`,
      );
    }

    if (group.reDistributeAmount !== undefined && group.reDistributeAmount !== 0) {
      throw new Error('please distribute out redistribution amount before any further transaction');
    }

    const activeMembers = group.groupMemberList.filter((member) => !member.isDeleted);
    const activeMemberEmails = activeMembers.map((member) => member.email);

    let finalPerticipatedMembers: string[] = [];
    let finalMembersShareList: { member_email: Types.ObjectId | string; share_amount: number }[] = [];
    const finalContributionType: 'allClear' | 'custom' = contribution_type || 'allClear';
    let finalContributionList: { member_email: Types.ObjectId | string; contributed_amount: number }[] = [];

    if (shareWith === 'all') {
      if (perticipated_members && perticipated_members.length > 0) {
        throw new Error('perticipated_members should not be provided when shareWith is "all"');
      }
      finalPerticipatedMembers = activeMemberEmails;
    } else if (shareWith === 'custom') {
      if (!perticipated_members || perticipated_members.length === 0) {
        throw new Error('perticipated_members is required when shareWith is "custom"');
      }
      const invalidEmails = perticipated_members.filter(
        (email: string) => !activeMemberEmails.includes(email),
      );
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid member emails in perticipated_members: ${invalidEmails.join(', ')}`);
      }
      finalPerticipatedMembers = perticipated_members;
    } else {
      throw new Error('Invalid shareWith value: must be "all" or "custom"');
    }

    if (!slice_type) {
      throw new Error('slice_type is required for group transactions');
    }

    if (slice_type === 'equal') {
      if (!amount) {
        throw new Error('amount is required for equal distribution');
      }
      if (members_Share_list && members_Share_list.length > 0) {
        throw new Error('members_Share_list should not be provided when slice_type is "equal"');
      }
      const shareAmount = amount / finalPerticipatedMembers.length;
      finalMembersShareList = finalPerticipatedMembers.map((email) => {
        const member = activeMembers.find((m) => m.email === email);
        return {
          member_email: member?.member_id && isValidObjectId(member.member_id)
            ? safeIdConverter(member.member_id)
            : email,
          share_amount: shareAmount,
        };
      });
    } else if (slice_type === 'custom') {
      if (!members_Share_list || members_Share_list.length === 0) {
        throw new Error('members_Share_list is required for custom slice_type');
      }
      for (const member of members_Share_list) {
        if (!member.member_email) {
          throw new Error('member_email is required for each entry in members_Share_list');
        }
        const email = activeMembers.find(
          (m) =>
            m.email === member.member_email ||
            (m.member_id && isValidObjectId(member.member_email) && m.member_id.toString() === member.member_email.toString()),
        )?.email;
        if (!email || !finalPerticipatedMembers.includes(email)) {
          throw new Error(`Member ${member.member_email} is not part of perticipated_members`);
        }
        if (typeof member.share_amount !== 'number' || member.share_amount <= 0) {
          throw new Error(`Invalid or missing share_amount for member ${member.member_email}`);
        }
      }
      const totalShareAmount = members_Share_list.reduce(
        (sum: number, member: { share_amount: number }) => sum + member.share_amount,
        0,
      );
      if (!amount) {
        amount = totalShareAmount;
      } else if (totalShareAmount !== amount) {
        throw new Error(
          `Total share_amount (${totalShareAmount}) does not match transaction amount (${amount})`,
        );
      }
      finalMembersShareList = members_Share_list.map((member: { member_email: string | Types.ObjectId; share_amount: number }) => ({
        member_email: isValidObjectId(member.member_email)
          ? safeIdConverter(member.member_email)
          : member.member_email,
        share_amount: member.share_amount,
      }));
    } else {
      throw new Error('Invalid slice_type: must be "equal" or "custom"');
    }

    if (finalContributionType === 'allClear') {
      if (contribution_list && contribution_list.length > 0) {
        throw new Error('contribution_list should not be provided when contribution_type is "allClear"');
      }
      finalContributionList = finalMembersShareList.map((share) => ({
        member_email: share.member_email,
        contributed_amount: share.share_amount,
      }));
    } else if (finalContributionType === 'custom') {
      if (!contribution_list || contribution_list.length === 0) {
        throw new Error('contribution_list is required for custom contribution_type');
      }
      for (const contribution of contribution_list) {
        if (!contribution.member_email) {
          throw new Error('member_email is required for each entry in contribution_list');
        }
        const email = activeMembers.find(
          (m) =>
            m.email === contribution.member_email ||
            (m.member_id && isValidObjectId(contribution.member_email) && m.member_id.toString() === contribution.member_email.toString()),
        )?.email;
        if (!email || !finalPerticipatedMembers.includes(email)) {
          throw new Error(`Member ${contribution.member_email} is not part of perticipated_members`);
        }
        if (typeof contribution.contributed_amount !== 'number' || contribution.contributed_amount < 0) {
          throw new Error(`Invalid or missing contributed_amount for member ${contribution.member_email}`);
        }
      }
      const totalContributedAmount = contribution_list.reduce(
        (sum: number, contribution: { contributed_amount: number }) => sum + contribution.contributed_amount,
        0,
      );
      if (totalContributedAmount !== amount) {
        throw new Error(
          `Total contributed_amount (${totalContributedAmount}) does not match transaction amount (${amount})`,
        );
      }
      // Ensure all participated members are accounted for in contribution_list
      finalContributionList = finalPerticipatedMembers.map((email) => {
        const contribution = contribution_list.find(
          (c: any) =>
            c.member_email === email ||
            (isValidObjectId(c.member_email) && activeMembers.find((m) => m.email === email)?.member_id?.toString() === c.member_email.toString()),
        );
        const member = activeMembers.find((m) => m.email === email);
        return {
          member_email: member?.member_id && isValidObjectId(member.member_id)
            ? safeIdConverter(member.member_id)
            : email,
          contributed_amount: contribution ? contribution.contributed_amount : 0,
        };
      });
    } else {
      throw new Error('Invalid contribution_type: must be "allClear" or "custom"');
    }

    const transactionIds: Types.ObjectId[] = [];
    for (const memberEmail of finalPerticipatedMembers) {
      const groupMember = activeMembers.find((m) => m.email === memberEmail);
      // CHANGED: Use isValidObjectId to determine if member_id should be converted
      const idOrEmail = groupMember?.member_id && isValidObjectId(groupMember.member_id)
        ? safeIdConverter(groupMember.member_id)
        : memberEmail;
      const shareEntry = finalMembersShareList.find(
        (share) => share.member_email.toString() === idOrEmail.toString(),
      );
      const contributionEntry = finalContributionList.find(
        (contribution) => contribution.member_email.toString() === idOrEmail.toString(),
      );

      const shareAmount = shareEntry ? shareEntry.share_amount : 0;
      const contributedAmount = contributionEntry ? contributionEntry.contributed_amount : 0;
      const borrowedOrLendAmount = contributedAmount - shareAmount;
      const inDebt = borrowedOrLendAmount < 0;

      const transactionData = {
        transactionType,
        transaction_Code,
        currency,
        date: effectiveDate,
        amount: shareAmount,
        inDebt,
        borrowedOrLendAmount: Math.abs(borrowedOrLendAmount),
        description,
        type_id: safeIdConverter(type_id) as Types.ObjectId,
        user_id,
        isGroupTransaction: true,
        group_id: safeIdConverter(group_id) as Types.ObjectId,
        typeModel:
          transactionType === transactionTypeConst.expense
            ? 'TPersonalExpenseTypes'
            : 'TPersonalIncomeTypes',
        spender_id_Or_Email:
          transactionType === transactionTypeConst.expense ? idOrEmail : null,
        earnedBy_id_Or_Email:
          transactionType === transactionTypeConst.income ? idOrEmail : null,
      };

      const savedTransaction = await TransactionModel.create(transactionData);
      transactionIds.push(savedTransaction._id as Types.ObjectId);
      transactions.push(transactionData);
    }

    const groupTransactionSummary = {
      amount,
      shareWith,
      perticipated_members: finalPerticipatedMembers,
      slice_type,
      members_Share_list: finalMembersShareList,
      contribution_type: finalContributionType,
      contribution_list: finalContributionList,
      reDistributableAmount: 0,
      fractionalTransaction_id: transactionIds,
    };

    await GroupsEachTransactionSummaryModel.create(groupTransactionSummary);

    return transactionIds;
  }

  const result = await TransactionModel.insertMany(transactions);
  return result;
};

// const addIncomeOrExpenses = async (user_id: Types.ObjectId, payload: any) => {
//   if (!user_id) {
//     throw new Error('User ID is required to add income or expenses');
//   }

//   const {
//     transactionType,
//     currency,
//     date,
//     description,
//     type_id,
//     isGroupTransaction,
//     group_id,
//     shareWith,
//     perticipated_members,
//     slice_type,
//     members_Share_list,
//     contribution_type,
//     contribution_list,
//     amount: payloadAmount,
//   } = payload;
//   let amount = payloadAmount || 0; // Default to 0 if not provided

//   // Validate required fields (description optional for expenses)
//   if (!transactionType || !currency || !date || !type_id) {
//     throw new Error('transactionType, currency, date, and type_id are required');
//   }

//   if (transactionType === transactionTypeConst.income && !description) {
//     throw new Error('description is required for income transactions');
//   }

//   // Validate type_id existence
//   let isTypeExist;
//   if (transactionType === transactionTypeConst.expense) {
//     isTypeExist = await ExpenseTypesModel.findOne({
//       user_id: { $in: [user_id, null] },
//       'expenseTypeList._id': safeIdConverter(type_id),
//     });
//   } else {
//     isTypeExist = await IncomeTypesModel.findOne({
//       user_id: { $in: [user_id, null] },
//       'incomeTypeList._id': safeIdConverter(type_id),
//     });
//   }
//   if (!isTypeExist) {
//     throw new Error(`Type with id ${type_id} does not exist for user ${user_id}`);
//   }

//   // Generate transaction code once for all transactions
//   const transaction_Code = await generateTransactionCode(
//     user_id,
//     isGroupTransaction ? safeIdConverter(group_id) : undefined,
//   );

//   // Prepare transactions
//   const transactions = [];

//   if (!isGroupTransaction || shareWith === 'none') {
//     // Personal transaction
//     if (!amount) {
//       throw new Error('amount is required for non-group transactions');
//     }
//     const transactionData= {
//       transactionType,
//       transaction_Code,
//       currency,
//       date,
//       amount,
//       inDebt: false,
//       borrowedOrLendAmount: 0,
//       description,
//       type_id: safeIdConverter(type_id) as Types.ObjectId,
//       user_id,
//       isGroupTransaction: false,
//       group_id: null,
//       typeModel:
//         transactionType === transactionTypeConst.expense
//           ? 'TPersonalExpenseTypes'
//           : 'TPersonalIncomeTypes',
//       spender_id_Or_Email:
//         transactionType === transactionTypeConst.expense ? user_id : null,
//       earnedBy_id_Or_Email:
//         transactionType === transactionTypeConst.income ? user_id : null,
//     };
//     transactions.push(transactionData);
//   } else {
//     // Group transaction
//     if (!group_id) {
//       throw new Error('group_id is required for group transactions');
//     }

//     const group = await ExpenseOrIncomeGroupModel.findOne({
//       _id: safeIdConverter(group_id),
//       user_id: user_id,
//     });

//     if (!group) {
//       throw new Error(
//         `Group with id ${group_id} does not exist or does not match transaction type or you are not owner of this group cant modify it`,
//       );
//     }

//     // Check if reDistributeAmount is not 0
//     if (group.reDistributeAmount !== undefined && group.reDistributeAmount !== 0) {
//       throw new Error('please distribute out redistribution amount before any further transaction');
//     }

//     // Filter out deleted members
//     const activeMembers = group.groupMemberList.filter((member) => !member.isDeleted);
//     const activeMemberEmails = activeMembers.map((member) => member.email);

//     let finalPerticipatedMembers: string[] = [];
//     let finalMembersShareList: { member_email: Types.ObjectId | string; share_amount: number }[] = [];
//     const finalContributionType: 'allClear' | 'custom' = contribution_type || 'allClear';
//     let finalContributionList: { member_email: Types.ObjectId | string; contributed_amount: number }[] = [];

//     // Handle shareWith logic
//     if (shareWith === 'all') {
//       if (perticipated_members && perticipated_members.length > 0) {
//         throw new Error('perticipated_members should not be provided when shareWith is "all"');
//       }
//       finalPerticipatedMembers = activeMemberEmails;
//     } else if (shareWith === 'custom') {
//       if (!perticipated_members || perticipated_members.length === 0) {
//         throw new Error('perticipated_members is required when shareWith is "custom"');
//       }
//       const invalidEmails = perticipated_members.filter(
//         (email: string) => !activeMemberEmails.includes(email),
//       );
//       if (invalidEmails.length > 0) {
//         throw new Error(`Invalid member emails in perticipated_members: ${invalidEmails.join(', ')}`);
//       }
//       finalPerticipatedMembers = perticipated_members;
//     } else {
//       throw new Error('Invalid shareWith value: must be "all" or "custom"');
//     }

//     // Handle slice_type logic
//     if (!slice_type) {
//       throw new Error('slice_type is required for group transactions');
//     }

//     if (slice_type === 'equal') {
//       if (!amount) {
//         throw new Error('amount is required for equal distribution');
//       }
//       if (members_Share_list && members_Share_list.length > 0) {
//         throw new Error('members_Share_list should not be provided when slice_type is "equal"');
//       }
//       const shareAmount = amount / finalPerticipatedMembers.length;
//       finalMembersShareList = finalPerticipatedMembers.map((email) => {
//         const member = activeMembers.find((m) => m.email === email);
//         return {
//           member_email: member?.member_id ? safeIdConverter(member.member_id) : email,
//           share_amount: shareAmount,
//         };
//       });
//     } else if (slice_type === 'custom') {
//       if (!members_Share_list || members_Share_list.length === 0) {
//         throw new Error('members_Share_list is required for custom slice_type');
//       }
//       // Validate members_Share_list
//       for (const member of members_Share_list) {
//         if (!member.member_email) {
//           throw new Error('member_email is required for each entry in members_Share_list');
//         }
//         const email = activeMembers.find((m) => m.member_id?.toString() === safeIdConverter(member.member_email).toString() || m.email === member.member_email)?.email;
//         if (!email || !finalPerticipatedMembers.includes(email)) {
//           throw new Error(`Member ${member.member_email} is not part of perticipated_members`);
//         }
//         if (typeof member.share_amount !== 'number' || member.share_amount <= 0) {
//           throw new Error(`Invalid or missing share_amount for member ${member.member_email}`);
//         }
//       }
//       // Calculate total share amount
//       const totalShareAmount = members_Share_list.reduce(
//         (sum: number, member: { share_amount: number }) => sum + member.share_amount,
//         0,
//       );
//       if (!amount) {
//         amount = totalShareAmount;
//       } else if (totalShareAmount !== amount) {
//         throw new Error(
//           `Total share_amount (${totalShareAmount}) does not match transaction amount (${amount})`,
//         );
//       }
//       finalMembersShareList = members_Share_list.map((member: { member_email: string | Types.ObjectId; share_amount: number }) => ({
//         member_email: safeIdConverter(member.member_email),
//         share_amount: member.share_amount,
//       }));
//     } else {
//       throw new Error('Invalid slice_type: must be "equal" or "custom"');
//     }

//     // Handle contribution_type logic
//     if (finalContributionType === 'allClear') {
//       if (contribution_list && contribution_list.length > 0) {
//         throw new Error('contribution_list should not be provided when contribution_type is "allClear"');
//       }
//       finalContributionList = finalMembersShareList.map((share) => ({
//         member_email: share.member_email,
//         contributed_amount: share.share_amount,
//       }));
//     } else if (finalContributionType === 'custom') {
//       if (!contribution_list || contribution_list.length === 0) {
//         throw new Error('contribution_list is required for custom contribution_type');
//       }
//       // Validate contribution_list
//       for (const contribution of contribution_list) {
//         if (!contribution.member_email) {
//           throw new Error('member_email is required for each entry in contribution_list');
//         }
//         const email = activeMembers.find((m) => m.member_id?.toString() === safeIdConverter(contribution.member_email).toString() || m.email === contribution.member_email)?.email;
//         if (!email || !finalPerticipatedMembers.includes(email)) {
//           throw new Error(`Member ${contribution.member_email} is not part of perticipated_members`);
//         }
//         if (typeof contribution.contributed_amount !== 'number' || contribution.contributed_amount < 0) {
//           throw new Error(`Invalid or missing contributed_amount for member ${contribution.member_email}`);
//         }
//       }
//       // Validate total contributed amount
//       const totalContributedAmount = contribution_list.reduce(
//         (sum: number, contribution: { contributed_amount: number }) => sum + contribution.contributed_amount,
//         0,
//       );
//       if (totalContributedAmount !== amount) {
//         throw new Error(
//           `Total contributed_amount (${totalContributedAmount}) does not match transaction amount (${amount})`,
//         );
//       }
//       finalContributionList = contribution_list.map((contribution: { member_email: string | Types.ObjectId; contributed_amount: number }) => ({
//         member_email: safeIdConverter(contribution.member_email),
//         contributed_amount: contribution.contributed_amount,
//       }));
//     } else {
//       throw new Error('Invalid contribution_type: must be "allClear" or "custom"');
//     }

//     // Create transactions for each participated member and collect their IDs
//     const transactionIds: Types.ObjectId[] = [];
//     for (const memberEmail of finalPerticipatedMembers) {
//       const groupMember = activeMembers.find((m) => m.email === memberEmail);
//       const idOrEmail = groupMember?.member_id ? safeIdConverter(groupMember.member_id) : memberEmail;
//       const shareEntry = finalMembersShareList.find(
//         (share) => share.member_email.toString() === (groupMember?.member_id?.toString() || memberEmail),
//       );
//       const contributionEntry = finalContributionList.find(
//         (contribution) => contribution.member_email.toString() === (groupMember?.member_id?.toString() || memberEmail),
//       );

//       const shareAmount = shareEntry ? shareEntry.share_amount : 0;
//       const contributedAmount = contributionEntry ? contributionEntry.contributed_amount : 0;
//       const borrowedOrLendAmount = contributedAmount - shareAmount;
//       const inDebt = borrowedOrLendAmount < 0;

//       const transactionData = {
//         transactionType,
//         transaction_Code,
//         currency,
//         date,
//         amount: shareAmount,
//         inDebt,
//         borrowedOrLendAmount: Math.abs(borrowedOrLendAmount),
//         description,
//         type_id: safeIdConverter(type_id) as Types.ObjectId,
//         user_id,
//         isGroupTransaction: true,
//         group_id: safeIdConverter(group_id) as Types.ObjectId,
//         typeModel:
//           transactionType === transactionTypeConst.expense
//             ? 'TPersonalExpenseTypes'
//             : 'TPersonalIncomeTypes',
//         spender_id_Or_Email:
//           transactionType === transactionTypeConst.expense ? idOrEmail : null,
//         earnedBy_id_Or_Email:
//           transactionType === transactionTypeConst.income ? idOrEmail : null,
//       };

//       // Save each transaction individually to ensure _id is generated
//       const savedTransaction = await TransactionModel.create(transactionData);
//       if (!savedTransaction || !savedTransaction._id) {
//        continue
//       }
//       transactionIds.push(savedTransaction._id as Types.ObjectId);
//       transactions.push(transactionData); // Keep for logging or other purposes
//     }

//     // Create GroupsEachTransactionSummary record with transaction IDs
//     const groupTransactionSummary = {
//       amount,
//       shareWith,
//       perticipated_members: finalPerticipatedMembers,
//       slice_type,
//       members_Share_list: finalMembersShareList,
//       contribution_type: finalContributionType,
//       contribution_list: finalContributionList,
//       reDistributableAmount: 0, // Default to 0 as per type
//       fractionalTransaction_id: transactionIds,
//     };

//     await GroupsEachTransactionSummaryModel.create(groupTransactionSummary);

//     return transactionIds; // Return transaction IDs for consistency
//   }

//   // Create transactions for personal transactions
//   const result = await TransactionModel.insertMany(transactions);
//   return result;
// };

const getAllIncomeAndExpenses = async (
  user_id: Types.ObjectId,
  transactionType?: 'income' | 'expense' | undefined,
  userEmail?: string, // Optional parameter to match email in spender_id_Or_Email or earnedBy_id_Or_Email
  type_id?: Types.ObjectId, // Optional type_id parameter
  group_id?: Types.ObjectId, // Optional group_id parameter
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
    const field =
      transactionType === 'expense'
        ? 'spender_id_Or_Email'
        : 'earnedBy_id_Or_Email';
    query[field] = {
      $in: [user_id, ...(userEmail ? [userEmail] : [])], // Match either user_id or userEmail
    };
  } else {
    // If no transactionType, match either spender_id_Or_Email or earnedBy_id_Or_Email
    query.$or = [
      {
        transactionType: 'expense',
        spender_id_Or_Email: {
          $in: [user_id, ...(userEmail ? [userEmail] : [])],
        },
      },
      {
        transactionType: 'income',
        earnedBy_id_Or_Email: {
          $in: [user_id, ...(userEmail ? [userEmail] : [])],
        },
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
    type_id: t.type_id,
    isGroupTransaction: t.isGroupTransaction,
    group_id: t.group_id,
    spender_id_Or_Email: t.spender_id_Or_Email,
    earnedBy_id_Or_Email: t.earnedBy_id_Or_Email,
  }));

  return transactionType === 'income'
    ? {
      totalIncome: Number(totalIncome) || 0,
      transactionsList: transactionsList || [],
    }
    : transactionType === 'expense'
      ? {
        totalExpenses: Number(totalExpenses) || 0,
        transactionsList: transactionsList || [],
      }
      : {
        totalIncome: Number(totalIncome) || 0,
        totalExpenses: Number(totalExpenses) || 0,
        remainingBalance: Number(totalIncome) - Number(totalExpenses) || 0,
        transactionsList: transactionsList || [],
      };
};

// New filtered service method
const getFilteredIncomeAndExpenses = async (
  user_id: Types.ObjectId,
  userEmail?: string,
  filters?: {
    balanceOverview?: 'totalRemaining' | 'totalExpense' | 'totalIncome';
    transactionType?: 'all' | 'expense' | 'income';
    month?: string; // Format: "Jun 2025", "May 2025", etc.
    type_id?: Types.ObjectId;
    group_id?: Types.ObjectId;
    searchText?: string;
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
  }
) => {
  if (!user_id) {
    throw new Error('User ID is required to fetch income and expenses');
  }

  // Fetch user profile to get preferred currency
  const userProfile = await ProfileModel.findOne({ user_id, isDeleted: false }).lean();
  const userPreferredCurrency: TCurrency = (userProfile?.preferredCurrency as TCurrency) || 'USD';

  // Build the base query
  const query: any = { user_id };

  // Add type_id filter
  if (filters?.type_id) {
    query.type_id = filters.type_id;
  }

  // Add group_id filter
  if (filters?.group_id) {
    query.group_id = filters.group_id;
  }

  // Add transaction type filter
  if (filters?.transactionType && filters.transactionType !== 'all') {
    query.transactionType = filters.transactionType;
    // Match spender_id_Or_Email for expenses or earnedBy_id_Or_Email for income
    const field = filters.transactionType === 'expense' ? 'spender_id_Or_Email' : 'earnedBy_id_Or_Email';
    query[field] = {
      $in: [user_id, ...(userEmail ? [userEmail] : [])],
    };
  } else {
    // If no specific transaction type, match either spender_id_Or_Email or earnedBy_id_Or_Email
    query.$or = [
      {
        transactionType: 'expense',
        spender_id_Or_Email: {
          $in: [user_id, ...(userEmail ? [userEmail] : [])],
        },
      },
      {
        transactionType: 'income',
        earnedBy_id_Or_Email: {
          $in: [user_id, ...(userEmail ? [userEmail] : [])],
        },
      },
    ];
  }

  // Add month filter
  if (filters?.month) {
    const [monthName, year] = filters.month.split(' ');
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    if (monthMap[monthName] !== undefined && year) {
      const startDate = new Date(parseInt(year), monthMap[monthName], 1);
      const endDate = new Date(parseInt(year), monthMap[monthName] + 1, 0, 23, 59, 59);

      query.date = {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      };
    }
  }

  // Add search text filter for description and type names
  if (filters?.searchText) {
    // First, get all type IDs that match the search text
    const matchData = await CategoryModel.find({
      user_id: { $in: [user_id, null] },
      'name': { $regex: filters.searchText, $options: 'i' }
    }).lean();

    // Extract matching type IDs
    const matchingTypeIds: Types.ObjectId[] = [];

    matchData.forEach(doc => {
      if (doc.name.toLowerCase().includes(filters.searchText!.toLowerCase())) {
        matchingTypeIds.push(doc._id);
      }
    });


    // Add search conditions for both description and type IDs
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        {
          description: {
            $regex: filters.searchText,
            $options: 'i' // Case insensitive
          }
        },
        {
          type_id: { $in: matchingTypeIds }
        }
      ]
    });
  }

  // Set up sorting
  const sortOptions: any = {};
  const sortBy = filters?.sortBy || 'date';
  const sortOrder = filters?.sortOrder === 'asc' ? 1 : -1;
  sortOptions[sortBy] = sortOrder;

  // Fetch transactions
  const transactions = await TransactionModel.find(query)
    .sort(sortOptions)
    .lean();

  // Prepare currency conversions for all transactions
  const currencyConversions = transactions.map(t => ({
    amount: t.amount,
    fromCurrency: (t.currency || 'USD') as TCurrency,
    toCurrency: userPreferredCurrency
  }));

  // Convert all amounts in batch for better performance
  const convertedAmounts = await convertCurrencyBatch(currencyConversions);

  // Calculate totals with converted amounts
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((t, index) => {
    const convertedAmount = convertedAmounts[index];
    if (t.transactionType === 'income') {
      totalIncome += convertedAmount;
    } else if (t.transactionType === 'expense') {
      totalExpenses += convertedAmount;
    }
  });

  const remainingBalance = totalIncome - totalExpenses;

  // Apply balance overview filter
  let filteredTransactions = transactions;
  if (filters?.balanceOverview) {
    switch (filters.balanceOverview) {
      case 'totalExpense':
        // Show only expenses
        filteredTransactions = transactions.filter(t => t.transactionType === 'expense');
        break;
      case 'totalIncome':
        // Show only income
        filteredTransactions = transactions.filter(t => t.transactionType === 'income');
        break;
      case 'totalRemaining':
        // Show all transactions (default behavior)
        break;
    }
  }

  // Create transactions list with type names and converted amounts
  const transactionsList = await Promise.all(
    filteredTransactions.map(async (t, index) => {
      let typeName = null;

      // Get the type name for this transaction
      if (t.type_id) {
        const findType = await CategoryModel.findOne({ _id: t.type_id }).lean();
        typeName = findType ? findType.name : null;
      }

      // Find the original transaction index to get the converted amount
      const originalIndex = transactions.findIndex(orig => orig._id.toString() === t._id.toString());
      const convertedAmount = originalIndex !== -1 ? convertedAmounts[originalIndex] : t.amount;

      return {
        _id: t._id,
        amount: convertedAmount, // Use converted amount
        originalAmount: t.amount, // Keep original amount for reference
        currency: userPreferredCurrency, // Show user's preferred currency
        originalCurrency: t.currency, // Keep original currency for reference
        date: t.date,
        description: t.description,
        transactionType: t.transactionType,
        type_id: t.type_id,
        typeName, // Include the type name in response
        isGroupTransaction: t.isGroupTransaction,
        group_id: t.group_id,
        spender_id_Or_Email: t.spender_id_Or_Email,
        earnedBy_id_Or_Email: t.earnedBy_id_Or_Email,
      };
    })
  );

  // Group transactions by date (YYYY-MM-DD) and include day name
  const groupsByDateMap: Record<string, {
    date: string;
    dayName: string;
    transactions: typeof transactionsList;
    totalIncome: number;
    totalExpenses: number;
    net: number;
  }> = {} as any;

  const getDayNameUTC = (yyyyMMdd: string) => {
    try {
      const d = new Date(`${yyyyMMdd}T00:00:00.000Z`);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getUTCDay()] || '';
    } catch {
      return '';
    }
  };

  (transactionsList || []).forEach((tx: any) => {
    const key = (tx?.date ? new Date(tx.date).toISOString().slice(0, 10) : 'Unknown');
    if (!groupsByDateMap[key]) {
      groupsByDateMap[key] = {
        date: key,
        dayName: key !== 'Unknown' ? getDayNameUTC(key) : 'Unknown',
        transactions: [],
        totalIncome: 0,
        totalExpenses: 0,
        net: 0,
      };
    }
    groupsByDateMap[key].transactions.push(tx);
    if (tx.transactionType === 'income') {
      groupsByDateMap[key].totalIncome += Number(tx.amount) || 0;
    } else if (tx.transactionType === 'expense') {
      groupsByDateMap[key].totalExpenses += Number(tx.amount) || 0;
    }
    groupsByDateMap[key].net = groupsByDateMap[key].totalIncome - groupsByDateMap[key].totalExpenses;
  });

  // Convert to sorted array based on date and requested sort order
  const groupedByDate = Object.keys(groupsByDateMap)
    .sort((a, b) => (sortOrder === -1 ? b.localeCompare(a) : a.localeCompare(b)))
    .map((key) => groupsByDateMap[key]);

  // Get available months for filter dropdown
  const availableMonths = await TransactionModel.aggregate([
    { $match: { user_id } },
    {
      $group: {
        _id: {
          year: { $year: { $dateFromString: { dateString: "$date" } } },
          month: { $month: { $dateFromString: { dateString: "$date" } } }
        }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonths = availableMonths.map(m => `${monthNames[m._id.month - 1]} ${m._id.year}`);

  // Get current date information for currentDate field
  const currentDate = new Date();
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const currentDateString = `${currentMonthName} ${currentYear}`;

  // Determine which month's data is being displayed
  const displayedDate = filters?.month || currentDateString;

  return {
    totalIncome: Number(totalIncome) || 0,
    totalExpenses: Number(totalExpenses) || 0,
    remainingBalance: Number(remainingBalance) || 0,
    currency: userPreferredCurrency, // Add user's preferred currency
    profileDate: {
      startDate: userProfile?.startDate || null,
      endDate: userProfile?.endDate || null
    },
    currentDate: displayedDate, // Shows which month's data is currently displayed
    // transactionsList: transactionsList || [],
    groupedByDate, // Date-wise grouped transactions with per-day totals
    availableMonths: formattedMonths,
    appliedFilters: filters,
    totalCount: transactionsList.length
  };
};

// Analytics Dashboard Service
const getAnalyticsDashboard = async (
  user_id: Types.ObjectId,
  userEmail?: string,
  options?: {
    viewType: 'monthly' | 'yearly';
    year: number;
    month?: string; // "Jun", "May", etc. (only for monthly view)
  }
) => {
  if (!user_id) {
    throw new Error('User ID is required to fetch analytics dashboard');
  }

  const { viewType = 'monthly', year, month } = options || {};

  if (viewType === 'monthly') {
    return await getMonthlyAnalytics(user_id, userEmail, year, month);
  } else {
    return await getYearlyAnalytics(user_id, userEmail, year);
  }
};

// Monthly Analytics Helper
const getMonthlyAnalytics = async (
  user_id: Types.ObjectId,
  userEmail?: string,
  year?: number,
  month?: string
) => {
  // Fetch user profile to get preferred currency
  const userProfile = await ProfileModel.findOne({ user_id, isDeleted: false }).lean();
  const userPreferredCurrency: TCurrency = (userProfile?.preferredCurrency as TCurrency) || 'USD';

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || new Date().toLocaleDateString('en-US', { month: 'short' });

  // Month mapping
  const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const monthNumber = monthMap[currentMonth];
  const startDate = new Date(currentYear, monthNumber, 1);
  const endDate = new Date(currentYear, monthNumber + 1, 0, 23, 59, 59);

  // Base query for the specific month
  const baseQuery: any = {
    user_id,
    date: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    },
    $or: [
      {
        transactionType: 'expense',
        spender_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] }
      },
      {
        transactionType: 'income',
        earnedBy_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] }
      }
    ]
  };

  // Get all transactions for the month
  const transactions = await TransactionModel.find(baseQuery).lean();

  // Prepare currency conversions for all transactions
  const currencyConversions = transactions.map(t => ({
    amount: t.amount,
    fromCurrency: (t.currency || 'USD') as TCurrency,
    toCurrency: userPreferredCurrency
  }));

  // Convert all amounts in batch for better performance
  const convertedAmounts = await convertCurrencyBatch(currencyConversions);

  // Calculate totals with converted amounts
  let totalIncome = 0;
  let totalExpenses = 0;

  const convertedTransactions = transactions.map((t, index) => ({
    ...t,
    convertedAmount: convertedAmounts[index]
  }));

  convertedTransactions.forEach((t) => {
    if (t.transactionType === 'income') {
      totalIncome += t.convertedAmount;
    } else if (t.transactionType === 'expense') {
      totalExpenses += t.convertedAmount;
    }
  });

  const savingAmount = totalIncome - totalExpenses;
  const savingPercentage = totalIncome > 0 ? Math.round((savingAmount / totalIncome) * 100) : 0;

  // Calculate monthly percentages
  const totalMonthlyAmount = totalIncome + totalExpenses;
  const incomePercentage = totalMonthlyAmount > 0 ? Math.round((totalIncome / totalMonthlyAmount) * 100) : 0;
  const expensePercentage = totalMonthlyAmount > 0 ? Math.round((totalExpenses / totalMonthlyAmount) * 100) : 0;

  // Get category breakdown for expenses (using converted transactions)
  const expenseTransactions = convertedTransactions.filter(t => t.transactionType === 'expense');
  const expenseCategoryBreakdown = await getCategoryBreakdown(user_id, expenseTransactions, totalExpenses, 'expense');

  // Get category breakdown for income (using converted transactions)
  const incomeTransactions = convertedTransactions.filter(t => t.transactionType === 'income');
  const incomeCategoryBreakdown = await getCategoryBreakdown(user_id, incomeTransactions, totalIncome, 'income');

  // Enhanced individual type summary with income, expense, saving per type and item-wise currency breakdown
  const typesSummary = await getIndividualTypeSummary(user_id, convertedTransactions, totalIncome, totalExpenses);

  // Get available months for navigation
  const availableMonths = await getAvailableMonths(user_id, currentYear);

  return {
    viewType: 'monthly',
    period: `${currentMonth} ${currentYear}`,
    currency: userPreferredCurrency,
    summary: {
      totalIncome: Number(totalIncome) || 0,
      totalExpenses: Number(totalExpenses) || 0,
      savingAmount: Number(savingAmount) || 0,
      savingPercentage: savingPercentage,
      percentages: {
        income: incomePercentage,
        expense: expensePercentage,
        saving: savingPercentage
      }
    },
    // expenseCategoryBreakdown,
    // incomeCategoryBreakdown,
    typesSummary,
    availableMonths,
    navigation: {
      currentYear,
      currentMonth,
      availableYears: await getAvailableYears(user_id)
    }
  };
};

// Yearly Analytics Helper
const getYearlyAnalytics = async (
  user_id: Types.ObjectId,
  userEmail?: string,
  year?: number
) => {
  // Fetch user profile to get preferred currency
  const userProfile = await ProfileModel.findOne({ user_id, isDeleted: false }).lean();
  const userPreferredCurrency: TCurrency = (userProfile?.preferredCurrency as TCurrency) || 'USD';

  const currentYear = year || new Date().getFullYear();

  // Get data for entire year
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

  const baseQuery: any = {
    user_id,
    date: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    },
    $or: [
      {
        transactionType: 'expense',
        spender_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] }
      },
      {
        transactionType: 'income',
        earnedBy_id_Or_Email: { $in: [user_id, ...(userEmail ? [userEmail] : [])] }
      }
    ]
  };

  // Aggregate by month
  const monthlyData = await TransactionModel.aggregate([
    { $match: baseQuery },
    {
      $addFields: {
        dateObj: { $dateFromString: { dateString: "$date" } }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: "$dateObj" },
          transactionType: "$transactionType"
        },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.month": 1 } }
  ]);

  // Process monthly data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyBreakdown = [];
  let yearlyTotalIncome = 0;
  let yearlyTotalExpenses = 0;

  for (let i = 0; i < 12; i++) {
    const monthName = monthNames[i];
    const monthIncome = monthlyData.find(d => d._id.month === i + 1 && d._id.transactionType === 'income')?.total || 0;
    const monthExpenses = monthlyData.find(d => d._id.month === i + 1 && d._id.transactionType === 'expense')?.total || 0;
    const monthSaving = monthIncome - monthExpenses;

    yearlyTotalIncome += monthIncome;
    yearlyTotalExpenses += monthExpenses;

    // Calculate monthly percentages
    const totalMonthlyAmount = monthIncome + monthExpenses;
    const incomePercentage = totalMonthlyAmount > 0 ? Math.round((monthIncome / totalMonthlyAmount) * 100) : 0;
    const expensePercentage = totalMonthlyAmount > 0 ? Math.round((monthExpenses / totalMonthlyAmount) * 100) : 0;
    const savingPercentage = monthIncome > 0 ? Math.round((monthSaving / monthIncome) * 100) : 0;

    monthlyBreakdown.push({
      month: monthName,
      monthNumber: i + 1,
      income: Number(monthIncome) || 0,
      expenses: Number(monthExpenses) || 0,
      saving: Number(monthSaving) || 0,
      percentages: {
        income: incomePercentage,
        expense: expensePercentage,
        saving: savingPercentage
      }
    });
  }

  const yearlySavingAmount = yearlyTotalIncome - yearlyTotalExpenses;
  const yearlySavingPercentage = yearlyTotalIncome > 0 ? Math.round((yearlySavingAmount / yearlyTotalIncome) * 100) : 0;

  // Calculate yearly percentages
  const yearlyTotalAmount = yearlyTotalIncome + yearlyTotalExpenses;
  const yearlyIncomePercentage = yearlyTotalAmount > 0 ? Math.round((yearlyTotalIncome / yearlyTotalAmount) * 100) : 0;
  const yearlyExpensePercentage = yearlyTotalAmount > 0 ? Math.round((yearlyTotalExpenses / yearlyTotalAmount) * 100) : 0;

  // Get category breakdown for the entire year
  const allYearTransactions = await TransactionModel.find(baseQuery).lean();

  // Get expense category breakdown
  const expenseTransactions = allYearTransactions.filter(t => t.transactionType === 'expense');
  const expenseCategoryBreakdown = await getCategoryBreakdown(user_id, expenseTransactions, yearlyTotalExpenses, 'expense');

  // Get income category breakdown  
  const incomeTransactions = allYearTransactions.filter(t => t.transactionType === 'income');
  const incomeCategoryBreakdown = await getCategoryBreakdown(user_id, incomeTransactions, yearlyTotalIncome, 'income');

  return {
    viewType: 'yearly',
    period: `${currentYear}`,
    summary: {
      totalIncome: Number(yearlyTotalIncome) || 0,
      totalExpenses: Number(yearlyTotalExpenses) || 0,
      savingAmount: Number(yearlySavingAmount) || 0,
      savingPercentage: yearlySavingPercentage,
      percentages: {
        income: yearlyIncomePercentage,
        expense: yearlyExpensePercentage,
        saving: yearlySavingPercentage
      }
    },
    monthlyBreakdown,
    expenseCategoryBreakdown,
    incomeCategoryBreakdown,
    navigation: {
      currentYear,
      availableYears: await getAvailableYears(user_id)
    }
  };
};

// Helper: Get Category Breakdown
const getCategoryBreakdown = async (
  user_id: Types.ObjectId,
  transactions: any[],
  totalAmount: number,
  transactionType: 'expense' | 'income'
) => {
  if (transactions.length === 0) return [];

  // Group transactions by type_id
  const typeGroups = transactions.reduce((acc, transaction) => {
    const typeId = transaction.type_id.toString();
    if (!acc[typeId]) {
      acc[typeId] = {
        typeId,
        amount: 0,
        count: 0,
        transactions: []
      };
    }
    // Use converted amount if available, otherwise use original amount
    const amount = transaction.convertedAmount !== undefined ? transaction.convertedAmount : transaction.amount;
    acc[typeId].amount += amount;
    acc[typeId].count += 1;
    acc[typeId].transactions.push(transaction);
    return acc;
  }, {});

  // Get type names and create breakdown
  const categoryBreakdown = await Promise.all(
    Object.values(typeGroups).map(async (group: any) => {

      const typeName = await CategoryModel.findOne({ _id: group.typeId, user_id }).lean().then(doc => doc ? doc.name : 'Unknown');

      const percentage = totalAmount > 0 ? Math.round((group.amount / totalAmount) * 100) : 0;

      return {
        typeId: group.typeId,
        typeName,
        amount: Number(group.amount) || 0,
        percentage,
        transactionCount: group.count,
        transactionType
      };
    })
  );

  // Sort by amount descending
  return categoryBreakdown.sort((a, b) => b.amount - a.amount);
};

// Helper: Get Individual Type Summary for Monthly View
const getIndividualTypeSummary = async (
  user_id: Types.ObjectId,
  transactions: any[],
  totalIncome: number,
  totalExpenses: number
) => {
  if (transactions.length === 0) return {};

  // Group transactions by type_id first, then we'll merge by typeName
  const typeGroups = transactions.reduce((acc, transaction) => {
    const typeId = transaction.type_id.toString();

    if (!acc[typeId]) {
      acc[typeId] = {
        typeId,
        typeName: '',
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        currencyBreakdown: {} // Track original currencies and amounts
      };
    }

    // Use converted amount if available, otherwise use original amount
    const convertedAmount = transaction.convertedAmount !== undefined ? transaction.convertedAmount : transaction.amount;
    const originalAmount = transaction.amount;
    const originalCurrency = transaction.currency || 'USD';

    // Track currency breakdown
    if (!acc[typeId].currencyBreakdown[originalCurrency]) {
      acc[typeId].currencyBreakdown[originalCurrency] = {
        income: 0,
        expenses: 0,
        count: 0
      };
    }

    if (transaction.transactionType === 'income') {
      acc[typeId].totalIncome += convertedAmount;
      acc[typeId].currencyBreakdown[originalCurrency].income += originalAmount;
    } else {
      acc[typeId].totalExpenses += convertedAmount;
      acc[typeId].currencyBreakdown[originalCurrency].expenses += originalAmount;
    }

    acc[typeId].currencyBreakdown[originalCurrency].count += 1;
    acc[typeId].transactionCount += 1;
    return acc;
  }, {});

  // Get type names for each typeId
  const typeWithNames = await Promise.all(
    Object.values(typeGroups).map(async (group: any) => {
      let typeName = 'Unknown';

      // Find the type name - check both income and expense types
      const expenseType = await CategoryModel.findOne({
        user_id: { $in: [user_id, null] },
        '_id': group.typeId
      }).lean();

      if (expenseType) {
        typeName = (expenseType as any).name;
      }

      return {
        ...group,
        typeName
      };
    })
  );

  // Now group by typeName and merge data from different typeIds with same name
  const typesSummaryObject: { [key: string]: any } = {};

  typeWithNames.forEach((group) => {
    if (!typesSummaryObject[group.typeName]) {
      typesSummaryObject[group.typeName] = {
        Income: 0,
        Expenses: 0,
        savingAmount: 0,
        percentages: {
          income: 0,
          expense: 0,
          saving: 0
        },
        currencyBreakdown: {}
      };
    }

    // Add income and expenses to the existing type
    typesSummaryObject[group.typeName].Income += group.totalIncome;
    typesSummaryObject[group.typeName].Expenses += group.totalExpenses;

    // Merge currency breakdown
    Object.keys(group.currencyBreakdown).forEach((currency) => {
      if (!typesSummaryObject[group.typeName].currencyBreakdown[currency]) {
        typesSummaryObject[group.typeName].currencyBreakdown[currency] = {
          income: 0,
          expenses: 0,
          count: 0
        };
      }

      typesSummaryObject[group.typeName].currencyBreakdown[currency].income += group.currencyBreakdown[currency].income;
      typesSummaryObject[group.typeName].currencyBreakdown[currency].expenses += group.currencyBreakdown[currency].expenses;
      typesSummaryObject[group.typeName].currencyBreakdown[currency].count += group.currencyBreakdown[currency].count;
    });
  });

  // Calculate final values for each type
  Object.keys(typesSummaryObject).forEach((typeName) => {
    const typeData = typesSummaryObject[typeName];

    // Calculate saving amount
    typeData.savingAmount = typeData.Income - typeData.Expenses;

    // Calculate percentages
    const typeTotal = typeData.Income + typeData.Expenses;
    typeData.percentages.income = typeTotal > 0 ? Math.round((typeData.Income / typeTotal) * 100) : 0;
    typeData.percentages.expense = typeTotal > 0 ? Math.round((typeData.Expenses / typeTotal) * 100) : 0;
    typeData.percentages.saving = typeData.Income > 0 ? Math.round((typeData.savingAmount / typeData.Income) * 100) : 0;

    // Ensure numbers are properly formatted
    typeData.Income = Number(typeData.Income) || 0;
    typeData.Expenses = Number(typeData.Expenses) || 0;
    typeData.savingAmount = Number(typeData.savingAmount) || 0;

    // Format currency breakdown for response
    const formattedCurrencyBreakdown = Object.keys(typeData.currencyBreakdown).map((currency) => {
      const currencyData = typeData.currencyBreakdown[currency];
      return {
        currency,
        income: Number(currencyData.income) || 0,
        expenses: Number(currencyData.expenses) || 0,
        total: Number(currencyData.income + currencyData.expenses) || 0,
        transactionCount: currencyData.count
      };
    }).sort((a, b) => b.total - a.total); // Sort by total amount descending

    typeData.currencyBreakdown = formattedCurrencyBreakdown;
  });

  // Convert object to array format
  const typesSummaryArray = Object.keys(typesSummaryObject).map((typeName) => ({
    typeName,
    ...typesSummaryObject[typeName]
  }));

  // Sort by income descending (optional - you can modify sorting as needed)
  return typesSummaryArray.sort((a, b) => (b.Income + b.Expenses) - (a.Income + a.Expenses));
};

// Helper: Get Available Months for a year
const getAvailableMonths = async (user_id: Types.ObjectId, year: number) => {
  const monthsData = await TransactionModel.aggregate([
    {
      $match: {
        user_id,
        date: {
          $gte: new Date(year, 0, 1).toISOString(),
          $lte: new Date(year, 11, 31, 23, 59, 59).toISOString()
        }
      }
    },
    {
      $addFields: {
        dateObj: { $dateFromString: { dateString: "$date" } }
      }
    },
    {
      $group: {
        _id: { $month: "$dateObj" }
      }
    },
    { $sort: { "_id": -1 } }
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthsData.map(m => monthNames[m._id - 1]);
};

// Helper: Get Available Years
const getAvailableYears = async (user_id: Types.ObjectId) => {
  const yearsData = await TransactionModel.aggregate([
    { $match: { user_id } },
    {
      $addFields: {
        dateObj: { $dateFromString: { dateString: "$date" } }
      }
    },
    {
      $group: {
        _id: { $year: "$dateObj" }
      }
    },
    { $sort: { "_id": -1 } }
  ]);

  return yearsData.map(y => y._id);
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

    // Update reDistributeAmount and redistributeTransactionCode in the group
    const group = await ExpenseOrIncomeGroupModel.findOne({
      _id: transaction.group_id,
    });

    if (group) {
      // If amount increases, others pay less (negative reDistributeAmount)
      // If amount decreases, others pay more (positive reDistributeAmount)
      const reDistributeAmount = group.reDistributeAmount || 0;
      group.reDistributeAmount = reDistributeAmount - amountDifference;
      // Set redistributeTransactionCode to the transaction's transaction_Code
      group.redistributeTransactionCode = transaction.transaction_Code;

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

const deleteIncomeOrExpenses = async (
  user_id: Types.ObjectId,
  transaction_id: Types.ObjectId,
) => {
  if (!user_id || !transaction_id) {
    throw new Error('user_id and transaction_id are required');
  }

  // Fetch the existing transaction
  const transaction = await TransactionModel.findOne({
    _id: transaction_id,
  });

  if (!transaction) {
    throw new Error(`Transaction with id ${transaction_id} does not exist`);
  }

  // Verify user permission
  if (!transaction.isGroupTransaction) {
    // Non-group transaction: check if user_id matches
    if (transaction.user_id.toString() !== user_id.toString()) {
      throw new Error(
        `User with id ${user_id} is not authorized to delete this transaction`,
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

    // Handle group transaction deletion - adjust redistribution amount
    const transactionAmount = transaction.amount || 0;

    // If deleting a group transaction, add its amount back to redistribution
    // This allows the amount to be redistributed among remaining members
    const reDistributeAmount = group.reDistributeAmount || 0;
    group.reDistributeAmount = reDistributeAmount + transactionAmount;
    group.redistributeTransactionCode = transaction.transaction_Code;

    await group.save();
  }

  // Delete the transaction
  const deletedTransaction = await TransactionModel.findOneAndDelete({
    _id: transaction_id,
  }).lean();

  if (!deletedTransaction) {
    throw new Error('Failed to delete transaction');
  }

  return {
    deletedTransaction,
    message: `Transaction ${transaction_id} deleted successfully`,
  };
};


//=========================redistribution ========================  


const getGroupMembers = async (group_id: Types.ObjectId) => {
  const group = await ExpenseOrIncomeGroupModel.findOne({
    _id: group_id,
  }).lean();

  if (!group) {
    throw new Error(`Group with id ${group_id} does not exist`);
  }

  // Filter members who are not deleted and have a valid member_id
  const redistributableMembers = group.groupMemberList.filter(
    (member) => !member.isDeleted && member.member_id,
  );

  return redistributableMembers;
};
const reDistributeAmountAmongMember = async (
  user_id: Types.ObjectId,
  group_id: Types.ObjectId,
  payload: Payload,
  session?: ClientSession, // Optional session for transaction
) => {
  const { slice_type, distributionAmong, isDiscard } = payload;

  // Start a transaction if no session is provided
  let localSession: ClientSession | null = null;
  if (!session) {
    localSession = await mongoose.startSession();
    await localSession.startTransaction();
  }
  const activeSession = session || localSession;

  try {
    // If isDiscard is true, reset group fields and return
    if (isDiscard) {
      const group = await ExpenseOrIncomeGroupModel.findOne(
        { _id: group_id, user_id, isDeleted: false },
        null,
        { session: activeSession },
      );

      if (!group) {
        throw new Error(`Group with id ${group_id} does not exist or you are not authorized`);
      }

      group.reDistributeAmount = 0;
      group.redistributeTransactionCode = null;
      await group.save({ session: activeSession });

      // Commit transaction if we started it
      if (localSession) {
        await localSession.commitTransaction();
      }

      return {
        message: 'Redistribution discarded successfully',
        success: true,
      };
    }

    // Validate payload for non-discard case
    if (!slice_type || !['equal', 'custom'].includes(slice_type)) {
      throw new Error('slice_type must be "equal" or "custom"');
    }
    if (!distributionAmong || distributionAmong.length === 0) {
      throw new Error('distributionAmong must contain at least one member');
    }
    for (const member of distributionAmong) {
      if (!member.memberEmail) {
        throw new Error('memberEmail is required for each member in distributionAmong');
      }
    }

    // Fetch the group
    const group = await ExpenseOrIncomeGroupModel.findOne(
      { _id: group_id, user_id, isDeleted: false },
      null,
      { session: activeSession },
    );

    if (!group) {
      throw new Error(
        `Group with id ${group_id} does not exist or you are not authorized or the group is deleted`,
      );
    }

    // Validate reDistributeAmount and redistributeTransactionCode
    if (group.reDistributeAmount === undefined || group.reDistributeAmount === 0) {
      throw new Error('No reDistributeAmount available in the group for redistribution');
    }
    if (!group.redistributeTransactionCode) {
      throw new Error('No redistributeTransactionCode available in the group');
    }

    const amount = group.reDistributeAmount;

    // Validate group members
    const activeMembers = group.groupMemberList.filter((member) => !member.isDeleted);
    const groupMemberEmails = activeMembers.map((member) => member.email);
    const invalidEmails = distributionAmong.filter(
      (member) => !groupMemberEmails.includes(member.memberEmail),
    );
    if (invalidEmails.length > 0) {
      throw new Error(
        `Invalid member emails in distributionAmong: ${invalidEmails
          .map((m) => m.memberEmail)
          .join(', ')}`,
      );
    }

    // Prepare members to distribute
    let membersToDistribute: Array<{ memberEmail: string; amount: number }> = [];
    if (slice_type === 'equal') {
      const amountPerMember = amount / distributionAmong.length; // Allow fractional amounts
      membersToDistribute = distributionAmong.map((member) => ({
        memberEmail: member.memberEmail,
        amount: amountPerMember,
      }));
    } else if (slice_type === 'custom') {
      for (const member of distributionAmong) {
        if (typeof member.spentOrEarnedAmount !== 'number') {
          throw new Error(
            `Invalid or missing spentOrEarnedAmount for member ${member.memberEmail}`,
          );
        }
      }
      const totalSpentAmount = distributionAmong.reduce(
        (sum, member) => sum + (member.spentOrEarnedAmount || 0),
        0,
      );
      const difference = Math.abs(totalSpentAmount - amount);
      if (difference >= 1) {
        throw new Error(
          `Total spentOrEarnedAmount (${totalSpentAmount}) differs from reDistributeAmount (${amount}) by ${difference}. Please redistribute again.`,
        );
      }
      membersToDistribute = distributionAmong.map((member) => ({
        memberEmail: member.memberEmail,
        amount: member.spentOrEarnedAmount!,
      }));
    }

    // Find the original transaction to copy details from
    const originalTransaction = await TransactionModel.findOne(
      {
        transaction_Code: group.redistributeTransactionCode,
        group_id,
        isGroupTransaction: true,
      },
      null,
      { session: activeSession },
    ).lean();

    if (!originalTransaction) {
      throw new Error(
        `No transaction found with redistributeTransactionCode ${group.redistributeTransactionCode}`,
      );
    }

    // Prepare transactions
    const transactions: any[] = [];
    for (const member of membersToDistribute) {
      const groupMember = activeMembers.find((m) => m.email === member.memberEmail);
      const idOrEmail = groupMember?.member_id || member.memberEmail;

      // Find existing transaction for the member
      const existingTransaction = await TransactionModel.findOne(
        {
          transaction_Code: group.redistributeTransactionCode,
          group_id,
          isGroupTransaction: true,
          [originalTransaction.transactionType === 'income'
            ? 'earnedBy_id_Or_Email'
            : 'spender_id_Or_Email']: idOrEmail,
        },
        null,
        { session: activeSession },
      );

      if (existingTransaction) {
        // Update existing transaction by adding the new amount
        const updatedTransaction = await TransactionModel.findOneAndUpdate(
          {
            transaction_Code: group.redistributeTransactionCode,
            group_id,
            isGroupTransaction: true,
            [originalTransaction.transactionType === 'income'
              ? 'earnedBy_id_Or_Email'
              : 'spender_id_Or_Email']: idOrEmail,
          },
          { $inc: { amount: member.amount } },
          { new: true, session: activeSession },
        ).lean();
        if (updatedTransaction) {
          transactions.push(updatedTransaction);
        } else {
          throw new Error(`Failed to update transaction for member ${member.memberEmail}`);
        }
      } else {
        // Create new transaction by copying original transaction details
        const transactionData = {
          transactionType: originalTransaction.transactionType,
          transaction_Code: group.redistributeTransactionCode,
          currency: originalTransaction.currency,
          date: originalTransaction.date,
          amount: member.amount,
          slice_type,
          description: originalTransaction.description,
          type_id: new Types.ObjectId(originalTransaction.type_id),
          user_id: new Types.ObjectId(group.user_id),
          isGroupTransaction: true,
          group_id,
          typeModel: originalTransaction.typeModel,
          spender_id_Or_Email:
            originalTransaction.transactionType === 'expense' ? idOrEmail : undefined,
          earnedBy_id_Or_Email:
            originalTransaction.transactionType === 'income' ? idOrEmail : undefined,
        };
        transactions.push(transactionData);
      }
    }

    // Create new transactions if any
    if (transactions.some((t) => !('_id' in t))) {
      const newTransactions = transactions.filter((t) => !('_id' in t));
      const createdTransactions = await TransactionModel.insertMany(newTransactions, {
        session: activeSession,
      });
      transactions.splice(
        0,
        transactions.length,
        ...createdTransactions,
        ...transactions.filter((t) => '_id' in t),
      );
    }

    // Update group: reset reDistributeAmount and redistributeTransactionCode
    group.reDistributeAmount = 0;
    group.redistributeTransactionCode = null;
    await group.save({ session: activeSession });

    // Commit transaction if we started it
    if (localSession) {
      await localSession.commitTransaction();
    }

    return { transactions: transactions, message: 'Redistribution successful', success: true };
  } catch (error: any) {
    // Abort transaction if we started it
    if (localSession) {
      await localSession.abortTransaction();
    }
    console.error('Redistribution failed:', error);
    throw new Error(error.message || 'Failed to redistribute amount among members.');
  } finally {
    // End session if we started it
    if (localSession) {
      localSession.endSession();
      console.log('Session ended');
    }
  }
};



const incomeAndExpensesService = {
  createIncomeType,
  createExpensesType,
  getAllIncomeType,
  getAllExpensesType,
  updateIncomeType,
  deleteIncomeType,
  updateExpensesType,
  deleteExpensesType,
  createOrUpdateExpenseOrIncomeGroup,
  addIncomeOrExpenses,
  getAllPersonalGroup,
  leaveGroupOrKickOut,
  deleteGroup,
  getSingleGroup,
  getIndividualExpenseOrIncome,
  modifyIncomeOrExpenses,
  deleteIncomeOrExpenses,
  getAllIncomeAndExpenses,
  getFilteredIncomeAndExpenses,
  getAnalyticsDashboard,
  getGroupMembers,
  reDistributeAmountAmongMember,
};

export default incomeAndExpensesService;
