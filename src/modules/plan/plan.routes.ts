import express from 'express';
import auth from '../../middleware/auth';
import planController from './plan.controller';
import { userRole } from '../../constants';

const planRoutes = express.Router();

planRoutes.post('/plan', auth([userRole.admin, userRole.user]), planController.createPlan);
planRoutes.patch('/plan/:id', auth([userRole.admin, userRole.user]), planController.updatePlan);
planRoutes.get('/plan/:id', auth([userRole.admin,userRole.user]), planController.getPlanById);
planRoutes.get('/plans', auth([userRole.admin, userRole.user]), planController.getPlans);
planRoutes.delete('/plan/:id', auth([userRole.admin, userRole.user]), planController.deletePlan);


export default planRoutes;