import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { formatINR } from '../../utils/formatters';

export class UnverifiedNewVendorRule implements FraudRule {
  code = 'VEN-01';
  category = 'VENDOR_RISK' as const;
  name = 'Unverified New Vendor High-Value Transaction';
  description = 'Flags high-value invoices (> ₹2,00,000) originating from unverified or first-time vendors.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, vendor } = context;

    if (!vendor) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 15,
        details: 'Vendor record not found in system vendor master. Processing as unregistered vendor.',
        detectedValue: 'Unregistered Vendor',
        expectedValue: 'Registered & KYC Verified Vendor Master Record',
      };
    }

    const isUnverified = !vendor.isVerified;
    const isHighValue = invoice.grandTotal >= 200000;

    if (isUnverified && isHighValue) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'WARNING',
        scoreContribution: 15,
        details: `Vendor KYC Incomplete: Vendor "${vendor.name}" is marked as Unverified, but has billed a high-value invoice of ${formatINR(invoice.grandTotal)}. Requires KYC verification before payment.`,
        detectedValue: `Unverified Vendor billing ${formatINR(invoice.grandTotal)}`,
        expectedValue: 'Verified Vendor Master Profile',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Vendor verification and transaction threshold verified.',
    };
  }
}

export class HistoricalVendorFraudRateRule implements FraudRule {
  code = 'VEN-02';
  category = 'VENDOR_RISK' as const;
  name = 'High Historical Vendor Dispute / Fraud Rate';
  description = 'Flags invoices from vendors who have 2 or more confirmed fraudulent invoices or audit flags on record.';

  evaluate(context: EvaluationContext): RuleResult {
    const { vendor } = context;

    if (!vendor) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Vendor profile not available.',
      };
    }

    if (vendor.fraudFlagCount >= 2) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `High Risk Vendor Profile: Vendor "${vendor.name}" has ${vendor.fraudFlagCount} confirmed audit flags / fraudulent incidents on historical record. Enhanced audit scrutiny required.`,
        detectedValue: `${vendor.fraudFlagCount} Prior Fraud Flags`,
        expectedValue: '0 Active Fraud Flags (Clean Supplier Record)',
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `Vendor has a clean track record (${vendor.fraudFlagCount} prior flags).`,
    };
  }
}
