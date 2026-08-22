import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatINR } from '../../utils/formatters';

export class TaxApplicabilityRule implements FraudRule {
  code = 'TAX-01';
  category = 'TAX_VALIDATION' as const;
  name = 'Tax Type Applicability (Intra vs Inter-State)';
  description = 'Validates that Intra-state supplies charge CGST+SGST (with zero IGST), and Inter-state supplies charge IGST (with zero CGST/SGST).';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, vendor } = context;

    // Determine supplier state code from vendor profile or first 2 digits of vendor GSTIN
    const supplierStateCode = vendor?.stateCode || (invoice.vendorGstin ? invoice.vendorGstin.substring(0, 2) : '');
    const posStateCode = invoice.placeOfSupplyStateCode;

    if (!supplierStateCode || !posStateCode) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'State code information insufficient to verify intra/inter-state tax applicability.',
      };
    }

    const isIntraState = supplierStateCode === posStateCode;
    const cgst = invoice.cgstAmount || 0;
    const sgst = invoice.sgstAmount || 0;
    const igst = invoice.igstAmount || 0;

    if (isIntraState) {
      // Intra-state: Should NOT have IGST > 0
      if (igst > 1.0) {
        return {
          ruleCode: this.code,
          ruleCategory: this.category,
          ruleName: this.name,
          status: 'FAIL',
          scoreContribution: 20,
          details: `Tax Applicability Violation: Supplier State (${supplierStateCode}) matches Place of Supply (${posStateCode}), representing an Intra-state transaction. However, Inter-state IGST of ${formatINR(igst)} was charged instead of CGST + SGST.`,
          detectedValue: `IGST: ${formatINR(igst)} charged on Intra-state supply`,
          expectedValue: 'CGST + SGST (IGST = ₹0.00)',
        };
      }
    } else {
      // Inter-state: Should NOT have CGST > 0 or SGST > 0
      if (cgst > 1.0 || sgst > 1.0) {
        return {
          ruleCode: this.code,
          ruleCategory: this.category,
          ruleName: this.name,
          status: 'FAIL',
          scoreContribution: 20,
          details: `Tax Applicability Violation: Supplier State (${supplierStateCode}) differs from Place of Supply (${posStateCode}), representing an Inter-state transaction. However, Intra-state CGST (${formatINR(cgst)}) / SGST (${formatINR(sgst)}) was charged instead of IGST.`,
          detectedValue: `CGST: ${formatINR(cgst)}, SGST: ${formatINR(sgst)} charged on Inter-state supply`,
          expectedValue: 'IGST (CGST = ₹0.00, SGST = ₹0.00)',
        };
      }
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: isIntraState
        ? 'Intra-state tax type (CGST + SGST) correctly applied.'
        : 'Inter-state tax type (IGST) correctly applied.',
    };
  }
}

export class TaxMathVerificationRule implements FraudRule {
  code = 'TAX-02';
  category = 'TAX_VALIDATION' as const;
  name = 'Tax Rate Mathematical Calculation';
  description = 'Verifies mathematical accuracy between taxable amount, GST rates, and total tax charged within ₹2.00 rounding tolerance.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, items } = context;

    if (!items || items.length === 0) {
      // If no items, verify header tax
      const totalTax = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);
      const expectedGrandTotal = invoice.taxableAmount + totalTax;
      const diff = Math.abs(invoice.grandTotal - expectedGrandTotal);

      if (diff > 2.0) {
        return {
          ruleCode: this.code,
          ruleCategory: this.category,
          ruleName: this.name,
          status: 'FAIL',
          scoreContribution: 20,
          details: `Tax Math Discrepancy: Header Grand Total (${formatINR(invoice.grandTotal)}) does not equal Taxable (${formatINR(invoice.taxableAmount)}) + Tax (${formatINR(totalTax)}). Discrepancy: ${formatINR(diff)}.`,
          detectedValue: formatINR(invoice.grandTotal),
          expectedValue: formatINR(expectedGrandTotal),
        };
      }

      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Header tax calculations align within tolerance.',
      };
    }

    // Verify each line item
    let calculatedTotalTax = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const expectedTax = (item.taxableValue * item.gstRate) / 100;
      const actualTax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
      calculatedTotalTax += actualTax;

      const itemDiff = Math.abs(expectedTax - actualTax);
      if (itemDiff > 2.0) {
        return {
          ruleCode: this.code,
          ruleCategory: this.category,
          ruleName: this.name,
          status: 'FAIL',
          scoreContribution: 20,
          details: `Item #${i + 1} ("${item.itemDescription}") tax calculation discrepancy: At ${item.gstRate}%, expected tax is ${formatINR(expectedTax)}, but invoice charges ${formatINR(actualTax)} (Variance: ${formatINR(itemDiff)}).`,
          detectedValue: `Charged: ${formatINR(actualTax)}`,
          expectedValue: `Expected: ${formatINR(expectedTax)} (${item.gstRate}%)`,
        };
      }
    }

    // Compare total tax on invoice vs item sum
    const headerTax = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);
    const taxDiff = Math.abs(headerTax - calculatedTotalTax);
    if (taxDiff > 2.0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 20,
        details: `Header total tax (${formatINR(headerTax)}) does not match sum of item taxes (${formatINR(calculatedTotalTax)}). Discrepancy: ${formatINR(taxDiff)}.`,
        detectedValue: formatINR(headerTax),
        expectedValue: formatINR(calculatedTotalTax),
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Tax mathematical calculations verified successfully across all line items.',
    };
  }
}

export class CGSTSGSTEqualityRule implements FraudRule {
  code = 'TAX-03';
  category = 'TAX_VALIDATION' as const;
  name = 'Intra-State CGST and SGST Equality';
  description = 'Verifies that CGST and SGST are strictly equal for applicable intra-state transactions.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, vendor } = context;

    const supplierStateCode = vendor?.stateCode || (invoice.vendorGstin ? invoice.vendorGstin.substring(0, 2) : '');
    const posStateCode = invoice.placeOfSupplyStateCode;

    // Only apply rule for intra-state transactions
    const isIntraState = supplierStateCode && posStateCode ? supplierStateCode === posStateCode : !invoice.isInterState;

    if (!isIntraState) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Not applicable for inter-state transaction (IGST evaluated separately).',
      };
    }

    const cgst = invoice.cgstAmount || 0;
    const sgst = invoice.sgstAmount || 0;
    const diff = Math.abs(cgst - sgst);

    if (diff > 1.0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 15,
        details: `Intra-state Tax Asymmetry: CGST (${formatINR(cgst)}) does not equal SGST (${formatINR(sgst)}). Under Indian GST law, intra-state tax must be divided equally.`,
        detectedValue: `CGST: ${formatINR(cgst)}, SGST: ${formatINR(sgst)}`,
        expectedValue: 'CGST == SGST (50/50 split)',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Intra-state CGST and SGST amounts are equal.',
    };
  }
}

export class LineItemSumMatchRule implements FraudRule {
  code = 'TAX-04';
  category = 'TAX_VALIDATION' as const;
  name = 'Line Item Sum to Header Grand Total Match';
  description = 'Ensures the sum of all individual line item totals matches the header grand total within ₹1.00 tolerance.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, items } = context;

    if (!items || items.length === 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'No item-level breakdown to cross-check.',
      };
    }

    const itemsSum = items.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
    const headerTotal = invoice.grandTotal;
    const diff = Math.abs(itemsSum - headerTotal);

    if (diff > 2.0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `Grand Total Mismatch: The invoice header claims ${formatINR(headerTotal)}, but the calculated sum of line items is ${formatINR(itemsSum)} (Discrepancy: ${formatINR(diff)}). Possible figure manipulation.`,
        detectedValue: `Header: ${formatINR(headerTotal)} vs Items Sum: ${formatINR(itemsSum)}`,
        expectedValue: formatINR(itemsSum),
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Sum of line items matches invoice header Grand Total.',
    };
  }
}
