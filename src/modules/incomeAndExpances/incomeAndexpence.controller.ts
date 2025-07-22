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



const addIncomeOrExpenses = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const user_id = idConverter(userId as string) as Types.ObjectId;

  const payload = req.body;

  const result = await incomeAndExpensesService.addIncomeOrExpenses(user_id, payload);

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
  getAllExpensesType
};

export default incomeAndExpensesController;
