import { Types } from 'mongoose';
import catchAsync from '../../util/catchAsync';
import idConverter from '../../util/idConverter';
import incomeAndExpensesService from './incomeAndexpence.service';

const createIncomeType = catchAsync(async (req, res) => {
  const userId = req.user?.id; // Optional, as user may not be authenticated for common types
  const user_id = userId ? idConverter(userId) : null; // Convert to ObjectId or null for common types

  console.log('here i am ', req.body.data);

  const payload = JSON.parse(req.body.data);
  const file = req?.file;

  if (!payload || !payload.name) {
    throw new Error('Payload with income type name is required');
  }

  const result = await incomeAndExpensesService.createIncomeType(
    payload,
    user_id,
    file,
  );

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income Type created successfully',
  });
});
const getAllIncomeType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const result = await incomeAndExpensesService.getAllIncomeType(user_id);

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'All the income type for this user is fund',
  });
});

const createExpensesType = catchAsync(async (req, res) => {
  const userId = req.user?.id; // Optional, as user may not be authenticated for common types
  const user_id = userId ? idConverter(userId) : null; // Convert to ObjectId or null for common types

  console.log('here i am ', req.body.data);

  const payload = JSON.parse(req.body.data);
  const file = req?.file;

  if (!payload || !payload.name) {
    throw new Error('Payload with income type name is required');
  }

  const result = await incomeAndExpensesService.createExpensesType(
    payload,
    user_id,
    file,
  );

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income Type created successfully',
  });
});
const getAllExpensesType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const result = await incomeAndExpensesService.getAllExpensesType(user_id);

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Expenses type found successfully',
  });
});

// Update Income Type
const updateIncomeType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const typeId = req.params.typeId;
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
  const file = req.file;

  const result = await incomeAndExpensesService.updateIncomeType(user_id, typeId, payload, file);
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income Type updated successfully',
  });
});

// Delete Income Type
const deleteIncomeType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const typeId = req.params.typeId;

  const result = await incomeAndExpensesService.deleteIncomeType(user_id, typeId);
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income Type deleted successfully',
  });
});

// Update Expenses Type
const updateExpensesType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const typeId = req.params.typeId;
  const payload = req.body.data ? JSON.parse(req.body.data) : req.body;
  const file = req.file;

  const result = await incomeAndExpensesService.updateExpensesType(user_id, typeId, payload, file);
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Expenses Type updated successfully',
  });
});

// Delete Expenses Type
const deleteExpensesType = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const typeId = req.params.typeId;

  const result = await incomeAndExpensesService.deleteExpensesType(user_id, typeId);
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Expenses Type deleted successfully',
  });
});




//---------------------------//=========================




const createOrUpdateExpenseOrIncomeGroup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  console.log("here is the user id", user_id);

  const payload = req.body;

  const result =
    await incomeAndExpensesService.createOrUpdateExpenseOrIncomeGroup(
      user_id,
      payload,
    );

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income or Expenses created successfully',
  });
});
const getAllPersonalGroup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const groupType = req.query.groupType as 'expense' | 'income'; // 'expense' or 'income'
  const groupName = req.query.groupName as string | undefined;


  const result = await incomeAndExpensesService.getAllPersonalGroup(
    user_id,
    groupName,
    groupType,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'All personal groups retrieved successfully',
  });
});
const leaveGroupOrKickOut = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const groupId = req.body.groupId as string;
  const group_id = idConverter(groupId) as Types.ObjectId;
  const memberId = req.body.memberId as string;
  const member_id = idConverter(memberId) as Types.ObjectId;  // Convert to ObjectId or null if not provided

  const result = await incomeAndExpensesService.leaveGroupOrKickOut(
    user_id,
    group_id,
    member_id,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Group member left or kicked out successfully',
  });
});


//======================================================================




const addIncomeOrExpenses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const payload = req.body;
  console.log("here is the payload", payload);

  // Validate payload for required fields (currency will be fetched from user profile)
  const { transactionType, date, type_id, isGroupTransaction, group_id, slice_type, isRedistribute, repeat } = payload;

  if (!transactionType || (!repeat && !date) || !type_id) {
    throw new Error('transactionType, type_id are required; date is required unless repeat is provided');
  }

  if (isGroupTransaction && (!group_id || !slice_type)) {
    throw new Error('group_id and slice_type are required for group transactions');
  }

  if (transactionType === 'income' && !payload.description) {
    throw new Error('description is required for income transactions');
  }

  const result = await incomeAndExpensesService.addIncomeOrExpenses(
    user_id,
    payload,
  );

  res.status(200).json({
    status: 'success',
    data: result,
    message: isRedistribute
      ? 'Redistribution transaction added successfully'
      : 'Income or Expenses added successfully',
  });
});

const getSingleGroup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const groupId = req.query.groupId as string;
  const group_id = idConverter(groupId) as Types.ObjectId;
  const result = await incomeAndExpensesService.getSingleGroup(
    user_id,
    group_id,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Group details retrieved successfully',
  });
});

const deleteGroup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const groupId = req.body.groupId as string;
  const group_id = idConverter(groupId) as Types.ObjectId;

  const result = await incomeAndExpensesService.deleteGroup(
    user_id,
    group_id,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Group deleted successfully',
  });
})


//======================================================================


const getIndividualExpenseOrIncome = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const incomeOrExpenseId = req.query.incomeOrExpenseId as string;
  const incomeOrExpense_id = idConverter(incomeOrExpenseId) as Types.ObjectId

  const result = await incomeAndExpensesService.getIndividualExpenseOrIncome(
    user_id,
    incomeOrExpense_id,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Individual income or expense retrieved successfully',
  });
});
const getAllIncomeAndExpenses = catchAsync(async (req, res) => {
  // Extract userId from req.user and convert to ObjectId
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  // Extract optional transactionType from query
  const transactionType = req.query.transactionType as 'income' | 'expense' | undefined;

  // Extract optional userEmail from req.user (if available)
  const userEmail = req.user.email as string | undefined;

  // Extract optional type_id and group_id from query and convert to ObjectId if provided
  const type_id = req.query.type_id ? idConverter(req.query.type_id as string) as Types.ObjectId : undefined;
  const group_id = req.query.group_id ? idConverter(req.query.group_id as string) as Types.ObjectId : undefined;

  // Call the service function
  const result = await incomeAndExpensesService.getAllIncomeAndExpenses(
    user_id,
    transactionType,
    userEmail,
    type_id,
    group_id
  );

  // Send response
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getFilteredIncomeAndExpenses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const userEmail = req.user.email as string | undefined;

  // Extract filter options from request query parameters
  const {
    balanceOverview, // "totalRemaining" | "totalExpense" | "totalIncome"
    transactionType, // "all" | "expense" | "income"
    month, // "Jun 2025" format or null for all months
    type_id,
    group_id,
    searchText, // Optional search in description
    sortBy, // "date" | "amount"
    sortOrder // "asc" | "desc"
  } = req.query;

  const result = await incomeAndExpensesService.getFilteredIncomeAndExpenses(
    user_id,
    userEmail,
    {
      balanceOverview: balanceOverview as "totalRemaining" | "totalExpense" | "totalIncome" | undefined,
      transactionType: transactionType as "all" | "expense" | "income" | undefined,
      month: month as string | undefined,
      type_id: type_id ? (idConverter(type_id as string) ?? undefined) : undefined,
      group_id: group_id ? (idConverter(group_id as string) ?? undefined) : undefined,
      searchText: searchText as string | undefined,
      sortBy: (sortBy as "date" | "amount") || 'date',
      sortOrder: (sortOrder as "asc" | "desc") || 'desc'
    }
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getAnalyticsDashboard = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const userEmail = req.user.email as string | undefined;

  // Extract parameters from request body
  const {
    viewType, // "monthly" | "yearly"
    year, // 2025
    month, // "Jun" (only for monthly view)
  } = req.body;

  const result = await incomeAndExpensesService.getAnalyticsDashboard(
    user_id,
    userEmail,
    {
      viewType: viewType || 'monthly',
      year: year || new Date().getFullYear(),
      month: month || null
    }
  );

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const modifyIncomeOrExpenses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const payload = req.body;
  const incomeOrExpenseId = req.query.incomeOrExpenseId as string;
  const incomeOrExpense_id = idConverter(incomeOrExpenseId) as Types.ObjectId

  const result = await incomeAndExpensesService.modifyIncomeOrExpenses(
    user_id,
    incomeOrExpense_id,
    payload,
  );
  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income or Expenses modified successfully',
  });
});

const reDistributeAmountAmongMember = catchAsync(async (req, res) => {
  const userId = req.user.id; // From auth middleware
  const user_id = idConverter(userId as string) as Types.ObjectId;
  const groupId = req.query.groupId as string;
  const group_id = idConverter(groupId) as Types.ObjectId;
  const payload = req.body;

  const result = await incomeAndExpensesService.reDistributeAmountAmongMember(
    user_id,
    group_id,
    payload,
  );

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Amount redistributed successfully',
  });
});





const incomeAndExpensesController = {
  addIncomeOrExpenses,
  createIncomeType,
  getAllIncomeType,
  createExpensesType,
  updateIncomeType,
  deleteIncomeType,
  updateExpensesType,
  deleteExpensesType,
  createOrUpdateExpenseOrIncomeGroup,
  getAllExpensesType,
  getAllPersonalGroup,
  leaveGroupOrKickOut,
  deleteGroup,
  getSingleGroup,
  getIndividualExpenseOrIncome,
  getAllIncomeAndExpenses,
  getFilteredIncomeAndExpenses,
  getAnalyticsDashboard,
  modifyIncomeOrExpenses,
  reDistributeAmountAmongMember
};

export default incomeAndExpensesController;
