import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatDateIndian } from '../../utils/formatters';

export class FutureInvoiceDateRule implements FraudRule {
  code = 'DAT-01';
  category = 'DATE_ANOMALY' as const;
  name = 'Future Invoice Date Violation';
  description = 'Detects invoices with issue dates set in the future beyond system date (+1 day drift allowance).';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice } = context;
    const invDate = new Date(invoice.invoiceDate);
    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (isNaN(invDate.getTime())) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 20,
        details: 'Invoice date is invalid or corrupt.',
        detectedValue: 'Invalid Date',
        expectedValue: 'Valid date string (DD/MM/YYYY)',
      };
    }

    if (invDate.getTime() > now.getTime() + ONE_DAY_MS) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 30,
        details: `Future-Dated Invoice: The invoice date (${formatDateIndian(invDate)}) is in the future. Financial liabilities cannot be accepted prior to date of occurrence.`,
        detectedValue: formatDateIndian(invDate),
        expectedValue: `<= Today (${formatDateIndian(now)})`,
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `Invoice date (${formatDateIndian(invDate)}) is valid.`,
    };
  }
}

export class StaleInvoiceReviewRule implements FraudRule {
  code = 'DAT-02';
  category = 'DATE_ANOMALY' as const;
  name = 'Stale Invoice Submission (Audit Review)';
  description = 'Flags invoices submitted more than 180 days after the invoice date as a low-severity audit review item.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice } = context;
    const invDate = new Date(invoice.invoiceDate);
    const now = new Date();
    const EIGHTEEN_MONTHS_DAYS = 180;
    const EIGHTEEN_MONTHS_MS = EIGHTEEN_MONTHS_DAYS * 24 * 60 * 60 * 1000;

    if (isNaN(invDate.getTime())) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Date validation handled by primary date rule.',
      };
    }

    const ageMs = now.getTime() - invDate.getTime();
    if (ageMs > EIGHTEEN_MONTHS_MS) {
      const daysOld = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 5, // Low-severity review indicator only
        details: `Stale Invoice Submission: Invoice date (${formatDateIndian(invDate)}) is ${daysOld} days old (> 180 days). Flagged for accounting period review.`,
        detectedValue: `${daysOld} days old`,
        expectedValue: '<= 180 days old',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Invoice submission date is within normal active financial window.',
    };
  }
}
