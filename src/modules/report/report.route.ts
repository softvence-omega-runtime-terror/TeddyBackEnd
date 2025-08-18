import { Router } from 'express';
import { getMonthlyReport } from './report.controller';

const reportRoutes = Router();

reportRoutes.get('/monthly', getMonthlyReport);

export default reportRoutes;
