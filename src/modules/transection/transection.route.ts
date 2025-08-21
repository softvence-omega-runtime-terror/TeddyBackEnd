import { Router } from 'express';
import { TransectionController } from './transection.controller';

const router = Router();

router.post('/group-transaction', TransectionController.createTransection);

export const transectionRoutes = router;
