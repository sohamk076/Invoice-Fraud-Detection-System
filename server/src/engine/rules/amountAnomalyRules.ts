import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatINR } from '../../utils/formatters';

export class VendorHistoricalAverageSpikeRule implements FraudRule {
  code = 'ANO-01';
  category = 'AMOUNT_ANOMALY' as const;
  name = 'Vendor Historical Average Spike';
  description = 'Detects sudden abnormally high transaction values (> 3.0x vendor historical average) for established vendors (>= 3 past invoices).';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, historicalInvoices } = context;

    if (!historicalInvoices || historicalInvoices.length < 3) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Insufficient historical baseline (< 3 past invoices). Standard amount evaluation applied.',
      };
    }

    // Filter out current invoice if present
    const pastInvoices = historicalInvoices.filter((h) => h.id !== invoice.id);
    if (pastInvoices.length < 3) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Historical profile below comparison threshold.',
      };
    }

    const sum = pastInvoices.reduce((acc, h) => acc + h.grandTotal, 0);
    const mean = sum / pastInvoices.length;
    const ratio = invoice.grandTotal / mean;

    // Only flag if exceeds 3.0x average
    if (ratio > 3.0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 20,
        details: `Historical Amount Spike: Invoice value of ${formatINR(invoice.grandTotal)} is ${ratio.toFixed(1)}x higher than vendor's historical average of ${formatINR(mean)} across ${pastInvoices.length} transactions. Requires financial justification.`,
        detectedValue: `${formatINR(invoice.grandTotal)} (${ratio.toFixed(1)}x avg)`,
        expectedValue: `<= ${formatINR(mean * 3.0)} (3x Historical Average)`,
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `Invoice value ${formatINR(invoice.grandTotal)} is within normal historical distribution (${ratio.toFixed(1)}x of average ${formatINR(mean)}).`,
    };
  }
}

export class SuspiciousRoundAmountRule implements FraudRule {
  code = 'ANO-02';
  category = 'AMOUNT_ANOMALY' as const;
  name = 'Suspicious High-Value Round Amount with Zero Tax';
  description = 'Detects high-value transactions (> ₹1,00,000) that are perfectly round numbers with zero GST charged.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice } = context;
    const amount = invoice.grandTotal || 0;
    const totalTax = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);

    const isHighValue = amount >= 100000;
    const isRoundNumber = amount % 1000 === 0;
    const isZeroTax = totalTax <= 1.0;

    if (isHighValue && isRoundNumber && isZeroTax) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 10,
        details: `Suspicious Round Figure: Transaction of ${formatINR(amount)} is an exact round sum with ₹0.00 GST recorded. High-value commercial transactions usually incur itemized GST calculations.`,
        detectedValue: `${formatINR(amount)} with ₹0.00 Tax`,
        expectedValue: 'Itemized commercial billing with applicable GST slabs',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Transaction amount and tax breakdown are normal.',
    };
  }
}
