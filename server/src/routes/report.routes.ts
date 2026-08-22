import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get(
  '/invoices/export-csv',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR', 'FINANCE_USER']),
  ReportController.exportInvoicesCSV
);

router.get(
  '/fraud/export-csv',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR']),
  ReportController.exportFraudRiskCSV
);

router.get(
  '/vendors/export-csv',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR', 'FINANCE_USER']),
  ReportController.exportVendorRiskCSV
);

router.get(
  '/audit/export-csv',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR']),
  ReportController.exportAuditCSV
);

router.get(
  '/preview',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR', 'FINANCE_USER']),
  ReportController.getReportPreview
);

router.get(
  '/fraud-summary',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR', 'FINANCE_USER']),
  ReportController.getFraudSummaryReport
);

export default router;
