import express from 'express';
import { userRole } from '../../constants';
import auth from '../../middleware/auth';
import groupTransactionController from './groupTransection.controller';

const groupTransactionRouter = express.Router();

// Define group transaction routes here
groupTransactionRouter.post('/createGroupTransaction', auth([userRole.user]), groupTransactionController.createGroupTransaction);

groupTransactionRouter.post('/addGroupMember/:groupId', auth([userRole.user]), groupTransactionController.addGroupMember);

groupTransactionRouter.get('/getGroups', auth([userRole.user]), groupTransactionController.getGroups);

groupTransactionRouter.post('/addGroupExpense/:groupId', auth([userRole.user]), groupTransactionController.addGroupExpense);

groupTransactionRouter.get('/getGroupTransactions/:groupId', auth([userRole.user]), groupTransactionController.getGroupTransactions);

groupTransactionRouter.get('/getGroupStatus/:groupId', auth([userRole.user]), groupTransactionController.getGroupStatus);

groupTransactionRouter.get('/getGroupDetails/:groupId', auth([userRole.user]), groupTransactionController.getGroupDetails);

export default groupTransactionRouter;