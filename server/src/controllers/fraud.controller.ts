import { Request, Response, NextFunction } from 'express';
import { FraudService } from '../services/fraud.service';

export class FraudController {
  public static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await FraudService.getAlerts(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const updated = await FraudService.updateAlert(req.params.id, req.body, actorId);
      res.status(200).json({
        success: true,
        message: 'Alert updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update alert.',
      });
    }
  }

  public static async getRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = FraudService.getRules();
      res.status(200).json({
        success: true,
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  }
}
