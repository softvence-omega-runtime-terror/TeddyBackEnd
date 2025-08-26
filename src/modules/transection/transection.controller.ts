import {
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
  const result = await TransectionService.createTransactionSummary(transectionData);

  res.status(200).json({
    status: 'success',
    message: 'transection created successfully..',
    data: result,
  });
});
const paybackTransectionAmount = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.paybackTransectionAmountToDB(req.body);

  res.status(200).json({
    status: 'success',
    message: 'transection created successfully..',
    data: result,
  });
});
const addMemberToEqualTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToEqualTransection(req.body);

  res.status(200).json({
    status: 'success',
    message: 'member added successfully..',
    data: result,
  });
});
const addMemberToCustomTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToCustomTransection(req.body);

  res.status(200).json({
    status: 'success',
    message: 'member added successfully..',
    data: result,
  });
});
const addMemberToTransaction = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.addMemberToTransaction(req.body);

  res.status(200).json({
    status: 'success',
    message: 'member added successfully..',
    data: result,
  });
});
const deleteMemberFromEqualTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await TransectionService.deleteMemberFromEqualTransection(req.body);

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
  addMemberToEqualTransection,
  getAllTransection,
  addMemberToCustomTransection,
  deleteMemberFromEqualTransection,
  addMemberToTransaction
};
