import express from "express"
import auth from "../../middleware/auth"
import { userRole } from "../../constants"
import incomeAndExpensesController from "./incomeAndexpence.controller"
import { upload } from "../../util/uploadImgToCludinary"


const incomeAndExpenseRouter = express.Router()


incomeAndExpenseRouter.post("/createIncomeType",auth([userRole.user]),upload.single("file"), incomeAndExpensesController.createIncomeType )
incomeAndExpenseRouter.get("/getAllIncomeType",auth([userRole.user]), incomeAndExpensesController.getAllIncomeType )


incomeAndExpenseRouter.post("/createExpensesType",auth([userRole.user]),upload.single("file"), incomeAndExpensesController.createExpensesType )
incomeAndExpenseRouter.get("/getAllExpensesType",auth([userRole.user]), incomeAndExpensesController.getAllExpensesType )


incomeAndExpenseRouter.post("/addIncomeOrExpenses",auth([userRole.user]), incomeAndExpensesController.addIncomeOrExpenses )

export default incomeAndExpenseRouter