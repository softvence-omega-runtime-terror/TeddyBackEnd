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


//---------------------------//=========================




const createOrUpdateExpenseOrIncomeGroup = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

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
  const memberId = req.body.memberId as string ;
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
  console.log("here is the payklods", payload)

  // Validate payload for required fields
  const { transactionType, currency, date, type_id, isGroupTransaction, group_id, distribution_type, isRedistribute } = payload;

  if (!transactionType || !currency || !date || !type_id) {
    throw new Error('transactionType, currency, date, and type_id are required');
  }

  if (isGroupTransaction && (!group_id || !distribution_type)) {
    throw new Error('group_id and distribution_type are required for group transactions');
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
  const groupId = req.body.groupId as string;
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
  const incomeOrExpenseId = req.body.incomeOrExpenseId as string;
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

  // Call the service function
  const result = await incomeAndExpensesService.getAllIncomeAndExpenses(user_id, transactionType, userEmail);

  // Send response
  res.status(200).json({
    status: 'success',
    data: result,
  });
});





const incomeAndExpensesController = {
  addIncomeOrExpenses,
  createIncomeType,
  getAllIncomeType,
  createExpensesType,
  createOrUpdateExpenseOrIncomeGroup,
  getAllExpensesType,
  getAllPersonalGroup,
  leaveGroupOrKickOut,
  deleteGroup,
  getSingleGroup,
  getIndividualExpenseOrIncome,
  getAllIncomeAndExpenses
};

export default incomeAndExpensesController;
