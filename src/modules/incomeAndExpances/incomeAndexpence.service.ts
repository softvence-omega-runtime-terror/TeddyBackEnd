import { startSession, Types } from 'mongoose';
import { ExpenseTypesModel, IncomeTypesModel, TransactionModel, ExpenseOrIncomeGroupModel } from './incomeAndexpence.model';
import { uploadImgToCloudinary } from '../../util/uploadImgToCludinary';
import { transactionTypeConst } from '../../constants';
import idConverter from '../../util/idConverter';
import { sendEmail } from '../../util/sendEmail';
import { ProfileModel } from '../user/user.model';
import config from '../../config';

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

const createOrUpdateExpenseOrIncomeGroup = async (
  user_id: Types.ObjectId,
  payload: { groupType: 'expense' | 'income'; memberEmails: string[]; group_id?: Types.ObjectId }
) => {
  const session = await startSession();
  try {
    session.startTransaction();

    const { groupType, memberEmails, group_id } = payload;

    // Fetch the creator's profile to include them in the group
    const creatorProfile = await ProfileModel.findOne({ user_id }).session(session);
    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // Check group creation limit if creating a new group (no group_id provided)
    if (!group_id) {
      const totalCreatedGroups = creatorProfile.totalCreatedGroups || 0;
      const maxGroups = creatorProfile.maxGroups || 3;
      if (totalCreatedGroups >= maxGroups) {
        throw new Error('Maximum group creation limit exceeded');
      }
    }

    // Prepare the groupMemberList, including the creator
    const processedMemberList = await Promise.all(
      // Include creator's email first
      [creatorProfile.email, ...memberEmails].map(async (email) => {
        // Check if the email corresponds to an existing profile
        const existingProfile = await ProfileModel.findOne({ email }).session(session);

        if (existingProfile) {
          // User exists on the platform
          return {
            email,
            member_id: existingProfile.user_id,
            existOnPlatform: true,
            isInvitationEmailSent: false,
            name: existingProfile.name || email, // Use name from profile or email as fallback
          };
        } else {
          // User does not exist, send invitation email
          const subject = 'Invitation to Join Our App';
          const html = `
            <h1>Welcome to Our App!</h1>
            <p>You have been invited to join our app by a user. You have been included in a ${groupType} group.</p>
            <p>Please sign up using this email: ${email}</p>
            <a href="${config.App_Download_Url}">Click here to sign up</a>
          `;

          const emailResult = await sendEmail(email, subject, html);

          if (emailResult.success) {
            return {
              email,
              member_id: null,
              existOnPlatform: false,
              isInvitationEmailSent: true,
              name: email, // Use email as name if profile not found
            };
          } else {
            throw new Error(`Failed to send invitation email to ${email}`);
          }
        }
      })
    );

    // Create or update the group
    const query = group_id
      ? { _id: group_id, user_id } // Update specific group if group_id is provided
      : { user_id, groupType }; // Create or update based on user_id and groupType if no group_id

    const group = await ExpenseOrIncomeGroupModel.findOneAndUpdate(
      query,
      {
        $set: {
          groupMemberList: processedMemberList,
          ...(group_id ? {} : { groupType }), // Set groupType only for create, not update
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, session }
    );

    // Update groupList for all members with existing profiles (including creator)
    await Promise.all(
      processedMemberList
        .filter((member) => member.existOnPlatform && member.member_id)
        .map(async (member) => {
          await ProfileModel.updateOne(
            { user_id: member.member_id },
            { $addToSet: { groupList: group._id } }, // Use $addToSet to avoid duplicates
            { session }
          );
        })
    );

    // If creating a new group (no group_id and no existing group found), increment totalCreatedGroups
    if (!group_id && group.createdAt === group.updatedAt) {
      await ProfileModel.updateOne(
        { user_id },
        { $inc: { totalCreatedGroups: 1 } },
        { session }
      );
    }

    await session.commitTransaction();
    return group;
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error('Error in createOrUpdateExpenseOrIncomeGroup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create or update group: ${errorMessage}`);
  } finally {
    session.endSession();
  }
};

const getAllPersonalGroup = async (
  user_id: Types.ObjectId,
  groupName?: string,
  groupType?: 'expense' | 'income'
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch groups: ${errorMessage}`);
  }
};
const leaveGroupOrKickOut = async (
  user_id: Types.ObjectId,
  member_id: Types.ObjectId,
  group_id: Types.ObjectId
) => {
  const session = await startSession();
  try {
    session.startTransaction();

    // Fetch the group by group_id
    const group = await ExpenseOrIncomeGroupModel.findOne({ _id: group_id }).session(session);
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
      (member) => member.member_id && member.member_id.equals(member_id)
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
      { session }
    );

    await session.commitTransaction();
    return { success: true, message: 'Member removed from group successfully' };
  } catch (error: unknown) {
    await session.abortTransaction();
    console.error('Error in leaveGroupOrKickOut:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to remove member from group: ${errorMessage}`);
  } finally {
    session.endSession();
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
    distribution_type,
    description,
    type_id,
    isGroupTransaction,
    group_id,
    distributionAmong,
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
      spender_id_Or_Email: transactionType === transactionTypeConst.expense ? user_id : null,
      earnedBy_id_Or_Email: transactionType === transactionTypeConst.income ? user_id : null,
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
      user_id:user_id,
      groupType: transactionType,
    });

    if (!group) {
      throw new Error(`Group with id ${group_id} does not exist or does not match transaction type or you are not owner of this group cant modify it`);
    }

    let membersToDistribute: Array<{ memberEmail: string; amount?: number }> = [];

    if (distribution_type === 'equal') {
      if (!amount) {
        throw new Error('amount is required for equal distribution');
      }
      // If distributionAmong is not provided or empty, use all group members
      if (!distributionAmong || distributionAmong.length === 0) {
        membersToDistribute = group.groupMemberList.map((member) => ({
          memberEmail: member.email,
        }));
      } else {
        // Validate provided memberEmails
        const groupMemberEmails = group.groupMemberList.map((member) => member.email);
        const invalidEmails = distributionAmong.filter(
          (member: { memberEmail: string }) => !groupMemberEmails.includes(member.memberEmail),
        );
        if (invalidEmails.length > 0) {
          throw new Error(
            `Invalid member emails in distributionAmong: ${invalidEmails
              .map((m: { memberEmail: string }) => m.memberEmail)
              .join(', ')}`,
          );
        }
        membersToDistribute = distributionAmong.map((member: { memberEmail: string }) => ({
          memberEmail: member.memberEmail,
        }));
      }
      // Calculate equal amount per member
      const amountPerMember = amount / membersToDistribute.length;
      membersToDistribute = membersToDistribute.map((member) => ({
        ...member,
        amount: amountPerMember,
      }));
    } 
    else if (distribution_type === 'custom') {
      // Require distributionAmong with spentAmount
      if (!distributionAmong || distributionAmong.length === 0) {
        throw new Error('distributionAmong with spentAmount is required for custom distribution');
      }
      // Validate spentAmount and memberEmails
      for (const member of distributionAmong) {
        if (!member.memberEmail) {
          throw new Error('memberEmail is required for each member in distributionAmong');
        }
        if (typeof member.spentAmount !== 'number' || member.spentAmount < 0) {
          throw new Error(`Invalid or missing spentAmount for member ${member.memberEmail}`);
        }
      }
      const groupMemberEmails = group.groupMemberList.map((member) => member.email);
      const invalidEmails = distributionAmong.filter(
        (member: { memberEmail: string }) => !groupMemberEmails.includes(member.memberEmail),
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
          (sum: number, member: { spentAmount: number }) => sum + member.spentAmount,
          0,
        );
      } else {
        // Validate total spentAmount matches provided amount
        const totalSpentAmount = distributionAmong.reduce(
          (sum: number, member: { spentAmount: number }) => sum + member.spentAmount,
          0,
        );
        if (totalSpentAmount !== amount) {
          throw new Error(
            `Total spentAmount (${totalSpentAmount}) does not match transaction amount (${amount})`,
          );
        }
      }
      membersToDistribute = distributionAmong.map((member: { memberEmail: string; spentAmount: number }) => ({
        memberEmail: member.memberEmail,
        amount: member.spentAmount,
      }));
    } else {
      throw new Error('Invalid distribution_type: must be "equal" or "custom"');
    }

    // Create a transaction for each member
    for (const member of membersToDistribute) {
      const groupMember = group.groupMemberList.find((m) => m.email === member.memberEmail);
      const idOrEmail = groupMember?.member_id || member.memberEmail;

      const transactionData= {
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
        spender_id_Or_Email: transactionType === transactionTypeConst.expense ? idOrEmail : null,
        earnedBy_id_Or_Email: transactionType === transactionTypeConst.income ? idOrEmail : null,
      };
      transactions.push(transactionData);
    }
  }

  console.log('Transactions to be saved:', transactions);

  // Create transactions using TransactionModel
  const result = await TransactionModel.insertMany(transactions);
  return result;
};

const incomeAndExpensesService = {
  
  createIncomeType,
  createExpensesType,
  getAllIncomeType,
  getAllExpensesType,
  createOrUpdateExpenseOrIncomeGroup,
  addIncomeOrExpenses,
  getAllPersonalGroup,
  leaveGroupOrKickOut
};

export default incomeAndExpensesService;