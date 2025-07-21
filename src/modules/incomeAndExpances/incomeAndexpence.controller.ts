import { Types } from "mongoose";
import catchAsync from "../../util/catchAsync";
import idConverter from "../../util/idConverter";
import incomeAndExpensesService from "./incomeAndexpence.service";
import { error } from "console";

const createIncomeType = catchAsync(async (req, res) => {
  const userId = req.user?.id; // Optional, as user may not be authenticated for common types
  const user_id = userId ? idConverter(userId) : null; // Convert to ObjectId or null for common types
  const payload = JSON.parse(req.body.data);
  const files = req.files;

  if (!payload || !payload.name) {
    throw new Error("Payload with income type name is required");
  }

  const result = await incomeAndExpensesService.createIncomeType(payload, user_id, files);

  res.status(200).json({
    status: "success",
    data: result,
    message: "Income Type created successfully",
  });
});



const createExpensesType =catchAsync(async(req, res)=>{
const userId= req.user.id
const user_id = idConverter(userId as string) as Types.ObjectId

const payload = req.body 



const result = await incomeAndExpensesService.createExpensesType(user_id, payload)

res.status(200).json({
  status: "success",
  data: result,
  message: "Expenses type successfully"
})


})



const addIncome =catchAsync(async(req, res)=>{
const userId= req.user.id
const user_id = idConverter(userId as string) as Types.ObjectId

const payload = req.body 



const result = await incomeAndExpensesService.addIncome(user_id, payload)

res.status(200).json({
  status: "success",
  data: result,
  message: "Income added successfully"
})


})




const incomeAndExpensesController ={
    addIncome,createIncomeType,createExpensesType
}

export default incomeAndExpensesController