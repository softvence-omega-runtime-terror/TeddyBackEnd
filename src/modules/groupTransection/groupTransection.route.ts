import express from 'express';
import { userRole } from '../../constants';
import auth from '../../middleware/auth';
import groupTransactionController from './groupTransection.controller';
import { localeMiddleware } from '../../middleware/locale';

const groupTransactionRouter = express.Router();

groupTransactionRouter.post('/createGroupTransaction', auth([userRole.user]), localeMiddleware, groupTransactionController.createGroupTransaction);

groupTransactionRouter.post('/addGroupMember/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.addGroupMember);

groupTransactionRouter.get('/getGroups', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroups);

groupTransactionRouter.get('/getGroups/:userId', localeMiddleware, groupTransactionController.getGroupsByUserId);

groupTransactionRouter.post('/addGroupExpense/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.addGroupExpense);

groupTransactionRouter.put('/updateGroupExpense/:groupId/:expenseId', auth([userRole.user]), localeMiddleware, groupTransactionController.updateGroupExpense);

groupTransactionRouter.delete('/deleteGroupExpense/:groupId/:expenseId', auth([userRole.user]), localeMiddleware, groupTransactionController.deleteGroupExpense);

groupTransactionRouter.get('/getGroupTransactions/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupTransactions);

groupTransactionRouter.get('/getGroupStatus/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupStatus);

groupTransactionRouter.get('/getGroupDetails/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupDetails);

groupTransactionRouter.get('/getGroupMembers/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupMembers);

groupTransactionRouter.delete('/deleteGroup/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.deleteGroup);

groupTransactionRouter.delete('/removeMember/:groupId/:memberEmail', auth([userRole.user]), localeMiddleware, groupTransactionController.removeMember);

groupTransactionRouter.patch('/updateGroupName/:groupId', auth([userRole.user]), localeMiddleware, groupTransactionController.updateGroupName);



groupTransactionRouter.get('/:groupId/settlements', auth([userRole.user]), localeMiddleware, groupTransactionController.getGroupSettlements);

groupTransactionRouter.post('/:groupId/settle-multiple-debts', auth([userRole.user]), localeMiddleware, groupTransactionController.settleMultipleGroupDebts);




groupTransactionRouter.post('/:groupId/settle-debt', auth([userRole.user]), localeMiddleware, groupTransactionController.settleGroupDebt);


export default groupTransactionRouter;