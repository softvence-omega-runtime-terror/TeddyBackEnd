import {
  createTransactionSummary,
  paybackTransectionAmountToDB,
  TransectionService,
} from './transection.service';
import catchAsync from '../../util/catchAsync';

const createTransection = catchAsync(async (req, res): Promise<void> => {
  const userId = req.user?.id; // Optional, as user may not be authenticated for common types

  // console.log(userId);

  const transectionData = {
    createdBy: userId,
    ...req.body
  };
  console.log(transectionData)
  const result = await createTransactionSummary(transectionData);

  res.status(200).json({
    status: 'success',
    message: 'transection created successfully..',
    data: result,
  });
});
const paybackTransectionAmount = catchAsync(async (req, res): Promise<void> => {
  const result = await paybackTransectionAmountToDB(req.body);

  res.status(200).json({
    status: 'success',
    message: 'transection created successfully..',
    data: result,
  });
});
const addMemberToTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToTransection();

  res.status(200).json({
    status: 'success',
    message: 'member added successfully..',
    data: result,
  });
});
const getAllTransection = catchAsync(async (req, res): Promise<void> => {
    const userId = req.user?.id; // Optional, as user may not be authenticated for common types

  const result = await TransectionService.getAllTransection(userId);

  res.status(200).json({
    status: 'success',
    message: 'Transection Fetched Successfully..',
    data: result,
  });
});

export const TransectionController = {
  createTransection,
  paybackTransectionAmount,
  addMemberToTransection,
  getAllTransection
};
