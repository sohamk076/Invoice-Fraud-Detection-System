import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';

export class VendorController {
  public static async getVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await VendorService.getVendors(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getVendorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendor = await VendorService.getVendorById(req.params.id);
      res.status(200).json({
        success: true,
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const created = await VendorService.createVendor(req.body, actorId);
      res.status(201).json({
        success: true,
        message: 'Vendor created successfully.',
        data: created,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create vendor.',
      });
    }
  }

  public static async updateVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const updated = await VendorService.updateVendor(req.params.id, req.body, actorId);
      res.status(200).json({
        success: true,
        message: 'Vendor updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update vendor.',
      });
    }
  }
}
