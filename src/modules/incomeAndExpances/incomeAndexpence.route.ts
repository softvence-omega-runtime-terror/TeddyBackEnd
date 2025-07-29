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


//========================= Group Routes ========================

incomeAndExpenseRouter.post("/createOrUpdateExpenseOrIncomeGroup",auth([userRole.user]), incomeAndExpensesController.createExpensesType )

incomeAndExpenseRouter.post("/getAllPersonalGroup",auth([userRole.user]), incomeAndExpensesController.getAllPersonalGroup )

incomeAndExpenseRouter.post("/getSingleGroup",auth([userRole.user]), incomeAndExpensesController.getSingleGroup )

incomeAndExpenseRouter.post("/leaveGroupOrKickOut",auth([userRole.user]), incomeAndExpensesController.leaveGroupOrKickOut )

incomeAndExpenseRouter.post("/deleteGroup",auth([userRole.user]), incomeAndExpensesController.deleteGroup )

//========================= Income and Expense Routes ========================

incomeAndExpenseRouter.post("/addIncomeOrExpenses",auth([userRole.user]), incomeAndExpensesController.addIncomeOrExpenses )
incomeAndExpenseRouter.post("/getAllIncomeAndExpenses", auth([userRole.user]), incomeAndExpensesController.getAllIncomeAndExpenses )



export default incomeAndExpenseRouter