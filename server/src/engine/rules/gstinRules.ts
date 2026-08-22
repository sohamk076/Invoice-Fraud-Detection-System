import { EvaluationContext, FraudRule, RuleResult } from '../types';
import { validateGSTIN } from '../../utils/gstinValidator';

export class GSTINFormatAndChecksumRule implements FraudRule {
  code = 'GST-01';
  category = 'GST_VALIDATION' as const;
  name = 'GSTIN Format & State Validity';
  description = 'Validates Indian GSTIN 15-character format, valid State Code (01-38), and MOD 36 checksum.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice } = context;
    const gstin = invoice.vendorGstin;

    if (!gstin) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 30,
        details: 'Vendor GSTIN is completely missing on the invoice header.',
        detectedValue: 'Missing GSTIN',
        expectedValue: '15-character Valid GSTIN (e.g. 27AAACT2727Q1ZW)',
      };
    }

    const validation = validateGSTIN(gstin);

    if (!validation.isValidFormat || !validation.isValidState) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 30,
        details: validation.errorMessage || `GSTIN "${gstin}" does not conform to the Indian GST format or state registry.`,
        detectedValue: gstin,
        expectedValue: 'Valid Indian GSTIN with state code 01-38',
      };
    }

    // Checksum mismatch (critical indicator of fabricated GSTIN)
    if (!validation.isValidChecksum) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'CRITICAL',
        scoreContribution: 30,
        details: `Invalid GSTIN Checksum: The check digit for "${gstin}" fails the official Indian GST algorithm. Likely fictitious.`,
        detectedValue: gstin,
        expectedValue: 'Valid GSTIN checksum verification',
      };
    }

    // Valid GSTIN: MUST NOT RECEIVE ANY PENALTY
    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `GSTIN "${gstin}" is valid (${validation.stateName || 'State Code ' + validation.stateCode}).`,
    };
  }
}

export class GSTINPanConsistencyRule implements FraudRule {
  code = 'GST-02';
  category = 'GST_VALIDATION' as const;
  name = 'GSTIN to PAN Consistency';
  description = 'Verifies that characters 3–12 of the Vendor GSTIN match the registered 10-digit PAN.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, vendor } = context;
    const gstin = (invoice.vendorGstin || '').trim().toUpperCase();

    if (!vendor || !vendor.pan) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Vendor PAN master record not available for cross-verification.',
      };
    }

    if (gstin.length < 12) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `Cannot verify PAN: GSTIN "${gstin}" is too short.`,
        detectedValue: gstin,
        expectedValue: `GSTIN containing PAN ${vendor.pan}`,
      };
    }

    const gstinPan = gstin.substring(2, 12);
    const registeredPan = vendor.pan.trim().toUpperCase();

    if (gstinPan !== registeredPan) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 25,
        details: `PAN Mismatch: Characters 3-12 of GSTIN indicate PAN "${gstinPan}", but Vendor Master record is registered under PAN "${registeredPan}".`,
        detectedValue: gstinPan,
        expectedValue: registeredPan,
      };
    }

    // Match = 0 pts penalty
    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: `GSTIN embedded PAN "${gstinPan}" matches registered Vendor PAN.`,
    };
  }
}

export class VendorMasterGSTINMatchRule implements FraudRule {
  code = 'GST-03';
  category = 'GST_VALIDATION' as const;
  name = 'Vendor Master GSTIN Match';
  description = 'Ensures the invoice GSTIN matches the registered GSTIN in the Vendor Master database.';

  evaluate(context: EvaluationContext): RuleResult {
    const { invoice, vendor } = context;

    if (!vendor) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'PASS',
        scoreContribution: 0,
        details: 'Vendor master record not attached.',
      };
    }

    const invoiceGstin = (invoice.vendorGstin || '').trim().toUpperCase();
    const vendorMasterGstin = (vendor.gstin || '').trim().toUpperCase();

    if (invoiceGstin !== vendorMasterGstin) {
      return {
        ruleCode: this.code,
        ruleCategory: this.category,
        ruleName: this.name,
        status: 'FAIL',
        scoreContribution: 20,
        details: `Vendor GSTIN Mismatch: Invoice specifies GSTIN "${invoiceGstin}", but Vendor Master profile contains "${vendorMasterGstin}".`,
        detectedValue: invoiceGstin,
        expectedValue: vendorMasterGstin,
      };
    }

    return {
      ruleCode: this.code,
      ruleCategory: this.category,
      ruleName: this.name,
      status: 'PASS',
      scoreContribution: 0,
      details: 'Invoice GSTIN matches Vendor Master registered GSTIN.',
    };
  }
}
