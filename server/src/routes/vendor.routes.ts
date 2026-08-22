import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createVendorSchema, updateVendorSchema } from '../schemas/vendor.schema';

const router = Router();

router.get('/', authenticateJWT, VendorController.getVendors);
router.get('/:id', authenticateJWT, VendorController.getVendorById);
router.post(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'FINANCE_USER']),
  validateRequest(createVendorSchema),
  VendorController.createVendor
);
router.patch(
  '/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR', 'FINANCE_USER']),
  validateRequest(updateVendorSchema),
  VendorController.updateVendor
);

export default router;
