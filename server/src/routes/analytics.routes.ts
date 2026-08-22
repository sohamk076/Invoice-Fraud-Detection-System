import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard-stats', authenticateJWT, AnalyticsController.getDashboardStats);
router.get('/fraud-trends', authenticateJWT, AnalyticsController.getFraudTrends);
router.get('/vendor-risk-matrix', authenticateJWT, AnalyticsController.getVendorRiskMatrix);

export default router;
