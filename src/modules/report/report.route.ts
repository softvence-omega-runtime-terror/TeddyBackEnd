import { Router } from 'express';
import { getMonthlyReport } from './report.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';

const reportRoutes = Router();

reportRoutes.get('/monthly', auth([userRole.admin, userRole.user]), getMonthlyReport);

export default reportRoutes;
