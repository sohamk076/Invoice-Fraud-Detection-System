import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export class AuditController {
  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuditService.getLogs(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}
