import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatINR } from '../../utils/formatters';

export class UnlinkedHighValuePORule implements FraudRule {
  code = 'PO-01';
  category = 'PO_MATCHING' as const;
  name = 'Unlinked High-Value Purchase Order';
  description = 'Flags invoices above ₹50,000 that lack a linked approved Purchase Order for 3-way matching.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, purchaseOrder } = context;

    const isHighValue = invoice.grandTotal >= 50000;
    const hasLinkedPO = Boolean(invoice.purchaseOrderId || purchaseOrder);

    if (isHighValue && !hasLinkedPO) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 15,
        details: `Missing Purchase Order: Commercial invoice of ${formatINR(invoice.grandTotal)} was submitted without a pre-approved Purchase Order reference. Company policy requires PO for transactions >= ₹50,000.`,
        detectedValue: 'No Linked PO',
        expectedValue: 'Valid Pre-Approved Purchase Order',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: hasLinkedPO
        ? `Invoice linked to Purchase Order #${purchaseOrder?.poNumber || invoice.purchaseOrderId}.`
        : 'Transaction is below mandatory PO threshold (< ₹50,000).',
    };
  }
}

export class POAmountLimitExceededRule implements FraudRule {
  code = 'PO-02';
  category = 'PO_MATCHING' as const;
  name = 'PO Authorized Financial Limit Exceeded';
  description = 'Detects invoices that exceed the approved Purchase Order amount by more than 5% tolerance.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, purchaseOrder } = context;

    if (!purchaseOrder) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'No linked PO to cross-evaluate amount limit.',
      };
    }

    const poAmount = purchaseOrder.totalAmount;
    const billedAmount = invoice.grandTotal;
    const maxAllowed = poAmount * 1.05; // 5% tolerance

    if (billedAmount > maxAllowed) {
      const overrunAmount = billedAmount - poAmount;
      const overrunPercent = ((overrunAmount / poAmount) * 100).toFixed(1);

      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `PO Amount Overrun: Billed amount of ${formatINR(billedAmount)} exceeds authorized PO limit of ${formatINR(poAmount)} by ${overrunPercent}% (+${formatINR(overrunAmount)}). Permissible tolerance is 5%.`,
        detectedValue: `${formatINR(billedAmount)} (+${overrunPercent}%)`,
        expectedValue: `<= ${formatINR(maxAllowed)} (Authorized PO Limit + 5%)`,
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `Billed amount ${formatINR(billedAmount)} is within approved PO limit of ${formatINR(poAmount)}.`,
    };
  }
}

export class POVendorMismatchRule implements FraudRule {
  code = 'PO-03';
  category = 'PO_MATCHING' as const;
  name = 'PO Vendor Identity Mismatch';
  description = 'Detects critical mismatch where a Purchase Order issued to Vendor A is being claimed/invoiced by Vendor B.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, purchaseOrder, vendor } = context;

    if (!purchaseOrder) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'No linked PO to check vendor identity.',
      };
    }

    if (purchaseOrder.vendorId !== invoice.vendorId) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 35,
        details: `PO Hijack / Identity Mismatch: Purchase Order #${purchaseOrder.poNumber} was authorized for a different vendor, but is being claimed by "${vendor?.name || invoice.vendorId}". Severe billing irregularity.`,
        detectedValue: `Invoiced by: ${vendor?.name || invoice.vendorId}`,
        expectedValue: `PO Authorized Vendor: ${purchaseOrder.vendorId}`,
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Purchase Order vendor matches invoice vendor.',
    };
  }
}
