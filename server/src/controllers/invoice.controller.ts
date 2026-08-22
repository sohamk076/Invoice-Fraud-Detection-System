import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';

export class InvoiceController {
  public static async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InvoiceService.getInvoices(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id);
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const created = await InvoiceService.createInvoice(req.body, actorId);
      res.status(201).json({
        success: true,
        message: 'Invoice created and evaluated for fraud.',
        data: created,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create invoice.',
      });
    }
  }

  public static async uploadInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please provide a PDF or image invoice document.',
        });
        return;
      }

      const actorId = req.user?.id;
      const vendorId = req.body.vendorId;

      const result = await InvoiceService.processUploadedFile(req.file, vendorId, actorId);

      res.status(201).json({
        success: true,
        message: 'Invoice uploaded and processed successfully.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to process uploaded file.',
      });
    }
  }

  public static async extractInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please provide a PDF or image invoice document.',
        });
        return;
      }

      const vendorId = req.body.vendorId;
      const result = await InvoiceService.extractInvoiceDocument(req.file, vendorId);

      res.status(200).json({
        success: true,
        message: 'Invoice document extracted successfully.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to extract invoice document.',
      });
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reviewNotes } = req.body;
      const actorId = req.user?.id;

      const updated = await InvoiceService.updateInvoiceStatus(
        req.params.id,
        status,
        reviewNotes,
        actorId
      );

      res.status(200).json({
        success: true,
        message: `Invoice status updated to "${status}".`,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update invoice status.',
      });
    }
  }

  public static async reEvaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = req.user?.id;
      const reEvaluated = await InvoiceService.reEvaluateInvoice(req.params.id, actorId);

      res.status(200).json({
        success: true,
        message: 'Invoice re-evaluated against latest fraud detection rules.',
        data: reEvaluated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to re-evaluate invoice.',
      });
    }
  }
}
