import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR']),
  AuditController.getLogs
);

export default router;
