import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  public static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFraudTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trends = await AnalyticsService.getFraudTrends();
      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getVendorRiskMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matrix = await AnalyticsService.getVendorRiskMatrix();
      res.status(200).json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      next(error);
    }
  }
}
