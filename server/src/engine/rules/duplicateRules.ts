import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatINR, formatDateIndian } from '../../utils/formatters';

export class ExactDuplicateInvoiceRule implements FraudRule {
  code = 'DUP-01';
  category = 'DUPLICATE' as const;
  name = 'Exact Duplicate Invoice Number';
  description = 'Detects if an invoice with the identical invoice number for the same vendor already exists.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, historicalInvoices } = context;

    if (!historicalInvoices || historicalInvoices.length === 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Invoice number is unique across vendor billing history.',
      };
    }

    const duplicate = historicalInvoices.find(
      (h) =>
        h.id !== invoice.id &&
        h.invoiceNumber.trim().toLowerCase() === invoice.invoiceNumber.trim().toLowerCase()
    );

    if (duplicate) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 35,
        details: `Duplicate invoice detected: Number "${invoice.invoiceNumber}" already exists on record (Settled/Recorded on ${formatDateIndian(duplicate.invoiceDate)} for ${formatINR(duplicate.grandTotal)}).`,
        detectedValue: `Duplicate of Invoice #${duplicate.invoiceNumber}`,
        expectedValue: 'Unique Invoice Number',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Invoice number is unique for this vendor.',
    };
  }
}

export class SuspiciousCloneAmountRule implements FraudRule {
  code = 'DUP-02';
  category = 'DUPLICATE' as const;
  name = 'Suspicious Clone Amount Closeness';
  description = 'Detects if identical transaction amounts were billed by the same vendor within a 7-day window.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, historicalInvoices } = context;

    if (!historicalInvoices || historicalInvoices.length === 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'No suspicious duplicate amounts detected.',
      };
    }

    const currentInvDate = new Date(invoice.invoiceDate).getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const cloneMatch = historicalInvoices.find((h) => {
      if (h.id === invoice.id) return false;
      const hDate = new Date(h.invoiceDate).getTime();
      const timeDiff = Math.abs(currentInvDate - hDate);
      const isSameAmount = Math.abs(h.grandTotal - invoice.grandTotal) < 1.0;
      return isSameAmount && timeDiff <= SEVEN_DAYS_MS;
    });

    if (cloneMatch) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `Identical amount clone: Vendor billed ${formatINR(invoice.grandTotal)} on ${formatDateIndian(invoice.invoiceDate)}, which matches Invoice #${cloneMatch.invoiceNumber} billed within 7 days (${formatDateIndian(cloneMatch.invoiceDate)}).`,
        detectedValue: `${formatINR(invoice.grandTotal)} on ${formatDateIndian(invoice.invoiceDate)}`,
        expectedValue: 'Distinct transaction amount or spread billing schedule',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'No identical transaction amounts within recent billing window.',
    };
  }
}
