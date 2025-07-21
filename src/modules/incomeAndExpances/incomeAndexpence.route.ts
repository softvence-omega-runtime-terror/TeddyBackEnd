import express from "express"
import auth from "../../middleware/auth"
import { userRole } from "../../constants"
import incomeAndExpensesController from "./incomeAndexpence.controller"

const incomeAndExpenseRouter = express.Router()


incomeAndExpenseRouter.post("createIncomeType",auth([userRole.user]), incomeAndExpensesController.createIncomeType )
incomeAndExpenseRouter.post("createExpensesType",auth([userRole.user]), incomeAndExpensesController.createExpensesType )
incomeAndExpenseRouter.post("addIncome",auth([userRole.user]), incomeAndExpensesController.addIncome )

export default incomeAndExpenseRouter