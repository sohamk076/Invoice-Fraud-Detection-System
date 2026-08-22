import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, PurchaseOrderController.getPurchaseOrders);
router.get('/:id', authenticateJWT, PurchaseOrderController.getPOById);
router.post(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'FINANCE_USER']),
  PurchaseOrderController.createPO
);

export default router;
