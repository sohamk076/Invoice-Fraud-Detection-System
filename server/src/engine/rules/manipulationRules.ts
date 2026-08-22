import { EvaluationContext, FraudRule, RuleResult } from '../types';

export class MissingMandatoryHSNSACRule implements FraudRule {
  code = 'MAN-01';
  category = 'MANIPULATION' as const;
  name = 'Missing Mandatory Indian HSN / SAC Code';
  description = 'Flags line items that omit mandatory Indian Harmonized System of Nomenclature (HSN) or Service Accounting Code (SAC).';

  evaluate(context: EvaluationContext): RuleResult {
    const { items } = context;

    if (!items || items.length === 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'No line items to evaluate for HSN/SAC classification.',
      };
    }

    const itemsMissingHsn = items.filter((it) => !it.hsnSac || it.hsnSac.trim() === '');

    if (itemsMissingHsn.length > 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 10,
        details: `Missing HSN/SAC Classification: ${itemsMissingHsn.length} line item(s) omit mandatory Indian HSN/SAC codes. Under Indian GST law, HSN classification is mandatory for tax compliance.`,
        detectedValue: `${itemsMissingHsn.length} items without HSN/SAC`,
        expectedValue: 'Valid 4 to 8 digit HSN/SAC code per line item',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'All line items include valid HSN/SAC classification codes.',
    };
  }
}

export class MissingMandatoryFieldsRule implements FraudRule {
  code = 'MAN-02';
  category = 'MANIPULATION' as const;
  name = 'Missing Mandatory GST Invoice Header Fields';
  description = 'Verifies presence of mandatory statutory fields required on an Indian GST Tax Invoice.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice } = context;
    const missing: string[] = [];

    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') missing.push('Invoice Number');
    if (!invoice.vendorGstin || invoice.vendorGstin.trim() === '') missing.push('Vendor GSTIN');
    if (!invoice.customerGstin || invoice.customerGstin.trim() === '') missing.push('Customer GSTIN');
    if (!invoice.placeOfSupply || invoice.placeOfSupply.trim() === '') missing.push('Place of Supply');
    if (!invoice.billingAddress || invoice.billingAddress.trim() === '') missing.push('Billing Address');

    if (missing.length > 0) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 15,
        details: `Statutory Invoice Fields Missing: ${missing.join(', ')} not provided on invoice document.`,
        detectedValue: `Missing: ${missing.join(', ')}`,
        expectedValue: 'Complete Indian GST Tax Invoice Header Details',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'All statutory Indian GST invoice header fields are complete.',
    };
  }
}
