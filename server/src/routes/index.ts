import { Router } from 'express';
import authRoutes from './auth.routes';
import invoiceRoutes from './invoice.routes';
import vendorRoutes from './vendor.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import fraudRoutes from './fraud.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import auditRoutes from './audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/vendors', vendorRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/fraud', fraudRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);

export default router;
