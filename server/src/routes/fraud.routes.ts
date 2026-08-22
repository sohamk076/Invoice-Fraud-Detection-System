import { Router } from 'express';
import { FraudController } from '../controllers/fraud.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updateAlertSchema } from '../schemas/alert.schema';

const router = Router();

router.get('/alerts', authenticateJWT, FraudController.getAlerts);
router.patch(
  '/alerts/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR']),
  validateRequest(updateAlertSchema),
  FraudController.updateAlert
);
router.get('/rules', authenticateJWT, FraudController.getRules);

export default router;
