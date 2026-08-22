import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrder.service';

export class PurchaseOrderController {
  public static async getPurchaseOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PurchaseOrderService.getPurchaseOrders(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getPOById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const po = await PurchaseOrderService.getPOById(req.params.id);
      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createPO(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const created = await PurchaseOrderService.createPO(req.body, actorId);
      res.status(201).json({
        success: true,
        message: 'Purchase order created successfully.',
        data: created,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create purchase order.',
      });
    }
  }
}
