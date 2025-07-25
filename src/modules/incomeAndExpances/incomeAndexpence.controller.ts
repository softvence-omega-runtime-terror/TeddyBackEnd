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

const addIncomeOrExpenses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const payload = req.body;

  const result = await incomeAndExpensesService.addIncomeOrExpenses(
    user_id,
    payload,
  );

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Income or Expenses added successfully',
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
  leaveGroupOrKickOut
};

export default incomeAndExpensesController;
