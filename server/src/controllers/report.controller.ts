import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  public static async exportInvoicesCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await ReportService.generateInvoiceCSV(req.query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="invoices_report_${Date.now()}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  public static async exportFraudRiskCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await ReportService.generateFraudRiskCSV(req.query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fraud_risk_report_${Date.now()}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  public static async exportVendorRiskCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await ReportService.generateVendorRiskCSV();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="vendor_risk_report_${Date.now()}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  public static async exportAuditCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csvData = await ReportService.generateAuditCSV(req.query);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_trail_report_${Date.now()}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      next(error);
    }
  }

  public static async getReportPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = (req.query.type as string) || 'INVOICES';
      const preview = await ReportService.getReportPreview(type, req.query);
      res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getFraudSummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await ReportService.getFraudSummaryReport();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
