import { createTransactionSummary, paybackTransectionAmountToDB } from './transection.service';
import catchAsync from "../../util/catchAsync";

const createTransection = catchAsync(async (req, res): Promise<void> => {
  const result = await createTransactionSummary(req.body);

  res.status(200).json({
    status: 'success',
    message: "transection created successfully..",
    data: result,
  });
});
const paybackTransectionAmount = catchAsync(async (req, res): Promise<void> => {
  const result = await paybackTransectionAmountToDB(req.body);

  res.status(200).json({
    status: 'success',
    message: "transection created successfully..",
    data: result,
  });
});

export const TransectionController ={
    createTransection,
    paybackTransectionAmount
}