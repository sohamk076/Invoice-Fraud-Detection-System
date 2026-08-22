import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware';
import { uploadInvoiceFile } from '../middleware/upload.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../schemas/invoice.schema';

const router = Router();

// List Invoices (Protected)
router.get('/', authenticateJWT, InvoiceController.getInvoices);

// Create Invoice manually (Protected)
router.post(
  '/',
  authenticateJWT,
  validateRequest(createInvoiceSchema),
  InvoiceController.createInvoice
);

// Upload Invoice Document (PDF/Image) (Protected)
router.post(
  '/upload',
  authenticateJWT,
  uploadInvoiceFile.single('file'),
  InvoiceController.uploadInvoice
);

// Extract Invoice Document without committing (Protected)
router.post(
  '/extract',
  authenticateJWT,
  uploadInvoiceFile.single('file'),
  InvoiceController.extractInvoice
);

// Get Invoice by ID (Protected)
router.get('/:id', authenticateJWT, InvoiceController.getInvoiceById);

// Update Invoice Status (Auditor / Admin only)
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole(['ADMIN', 'AUDITOR']),
  validateRequest(updateInvoiceStatusSchema),
  InvoiceController.updateStatus
);

// Re-evaluate Invoice against latest rules (Protected)
router.post('/:id/re-evaluate', authenticateJWT, InvoiceController.reEvaluate);

export default router;
