import { Router } from 'express';
import { TransectionController } from './transection.controller';

const router = Router();

router.post('/group-transaction', TransectionController.createTransection);
router.post('/payback-amount', TransectionController.paybackTransectionAmount);

export const transectionRoutes = router;
