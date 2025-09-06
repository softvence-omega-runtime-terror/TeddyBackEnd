import express from 'express';
import { userRole } from '../../constants';
import auth from '../../middleware/auth';
import groupTransactionController from './groupTransection.controller';

const groupTransactionRouter = express.Router();

// Define group transaction routes here
groupTransactionRouter.post('/createGroupTransaction', auth([userRole.user]),groupTransactionController.createGroupTransaction);

export default groupTransactionRouter;