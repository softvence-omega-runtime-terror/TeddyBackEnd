import express from "express"
import auth from "../../middleware/auth"
import { userRole } from "../../constants"
import incomeAndExpensesController from "./incomeAndexpence.controller"
import { upload } from "../../util/uploadImgToCludinary"


const incomeAndExpenseRouter = express.Router()

//Income and Expense Type Routes 
incomeAndExpenseRouter.post("/createIncomeType",auth([userRole.user]),upload.single("file"), incomeAndExpensesController.createIncomeType )

incomeAndExpenseRouter.get("/getAllIncomeType",auth([userRole.user]), incomeAndExpensesController.getAllIncomeType )

incomeAndExpenseRouter.post("/createExpensesType",auth([userRole.user]),upload.single("file"), incomeAndExpensesController.createExpensesType )

incomeAndExpenseRouter.get("/getAllExpensesType",auth([userRole.user,userRole.admin]), incomeAndExpensesController.getAllExpensesType )

// Update and Delete routes for Income and Expense Types
incomeAndExpenseRouter.put("/updateIncomeType/:typeId", auth([userRole.user]), upload.single("file"), incomeAndExpensesController.updateIncomeType);
incomeAndExpenseRouter.delete("/deleteIncomeType/:typeId", auth([userRole.user]), incomeAndExpensesController.deleteIncomeType);

incomeAndExpenseRouter.put("/updateExpensesType/:typeId", auth([userRole.user]), upload.single("file"), incomeAndExpensesController.updateExpensesType);
incomeAndExpenseRouter.delete("/deleteExpensesType/:typeId", auth([userRole.user]), incomeAndExpensesController.deleteExpensesType);


//========================= Group Routes ========================

incomeAndExpenseRouter.post("/createOrUpdateExpenseOrIncomeGroup",auth([userRole.user]), incomeAndExpensesController.createOrUpdateExpenseOrIncomeGroup )

incomeAndExpenseRouter.post("/getAllPersonalGroup",auth([userRole.user]), incomeAndExpensesController.getAllPersonalGroup )

incomeAndExpenseRouter.post("/getSingleGroup",auth([userRole.user]), incomeAndExpensesController.getSingleGroup )

incomeAndExpenseRouter.post("/leaveGroupOrKickOut",auth([userRole.user]), incomeAndExpensesController.leaveGroupOrKickOut )

incomeAndExpenseRouter.post("/deleteGroup",auth([userRole.user]), incomeAndExpensesController.deleteGroup )

//========================= Income and Expense Routes ========================

incomeAndExpenseRouter.post("/addIncomeOrExpenses",auth([userRole.user]), incomeAndExpensesController.addIncomeOrExpenses )
incomeAndExpenseRouter.post("/getAllIncomeAndExpenses", auth([userRole.user]), incomeAndExpensesController.getAllIncomeAndExpenses )

// New filtered API
incomeAndExpenseRouter.get("/getFilteredIncomeAndExpenses", auth([userRole.user]), incomeAndExpensesController.getFilteredIncomeAndExpenses )

// Analytics Dashboard API
incomeAndExpenseRouter.post("/getAnalyticsDashboard", auth([userRole.user]), incomeAndExpensesController.getAnalyticsDashboard )

incomeAndExpenseRouter.post("/getIndividualExpenseOrIncome", auth([userRole.user]), incomeAndExpensesController.getIndividualExpenseOrIncome)
incomeAndExpenseRouter.post("/modifyIncomeOrExpenses", auth([userRole.user]), incomeAndExpensesController.modifyIncomeOrExpenses)
incomeAndExpenseRouter.post(
  '/reDistributeAmountAmongMember',
  auth([userRole.user]),
  incomeAndExpensesController.reDistributeAmountAmongMember,
);



export default incomeAndExpenseRouter