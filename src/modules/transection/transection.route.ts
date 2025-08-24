import { Router } from 'express';
import { TransectionController } from './transection.controller';
import auth from '../../middleware/auth';
import { userRole } from '../../constants';

const router = Router();

router.get('/',auth([userRole.user, userRole.admin]), TransectionController.getAllTransection);
router.post('/group-transaction',auth([userRole.user, userRole.admin]), TransectionController.createTransection);
router.post('/payback-amount', TransectionController.paybackTransectionAmount);
router.post('/add-member-to-equal-slice-type', TransectionController.addMemberToEqualTransection)
router.post('/add-member-to-custom-slice-type', TransectionController.addMemberToCustomTransection)
router.delete('/delete-member-to-equal-slice-type', TransectionController.deleteMemberFromEqualTransection)
export const transectionRoutes = router;
