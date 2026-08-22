import {
  EvaluationContext,
  FraudEvaluationResult,
  FraudRule,
  RiskLevel,
  RuleResult,
} from './types';
import { ExactDuplicateInvoiceRule, SuspiciousCloneAmountRule } from './rules/duplicateRules';
import {
  GSTINFormatAndChecksumRule,
  GSTINPanConsistencyRule,
  VendorMasterGSTINMatchRule,
} from './rules/gstinRules';
import {
  CGSTSGSTEqualityRule,
  LineItemSumMatchRule,
  TaxApplicabilityRule,
  TaxMathVerificationRule,
} from './rules/taxRules';
import {
  SuspiciousRoundAmountRule,
  VendorHistoricalAverageSpikeRule,
} from './rules/amountAnomalyRules';
import { FutureInvoiceDateRule, StaleInvoiceReviewRule } from './rules/dateAnomalyRules';
import {
  HistoricalVendorFraudRateRule,
  UnverifiedNewVendorRule,
} from './rules/vendorRiskRules';
import {
  POAmountLimitExceededRule,
  POVendorMismatchRule,
  UnlinkedHighValuePORule,
} from './rules/purchaseOrderRules';
import {
  MissingMandatoryFieldsRule,
  MissingMandatoryHSNSACRule,
} from './rules/manipulationRules';
import { RISK_THRESHOLDS } from '../config/constants';

export class FraudDetectionEngine {
  private rules: FraudRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.rules = [
      // 1. Duplicate Detection
      new ExactDuplicateInvoiceRule(),
      new SuspiciousCloneAmountRule(),

      // 2. GSTIN Validation
      new GSTINFormatAndChecksumRule(),
      new GSTINPanConsistencyRule(),
      new VendorMasterGSTINMatchRule(),

      // 3. Tax Validation
      new TaxApplicabilityRule(),
      new TaxMathVerificationRule(),
      new CGSTSGSTEqualityRule(),
      new LineItemSumMatchRule(),

      // 4. Amount Anomaly
      new VendorHistoricalAverageSpikeRule(),
      new SuspiciousRoundAmountRule(),

      // 5. Date Anomaly
      new FutureInvoiceDateRule(),
      new StaleInvoiceReviewRule(),

      // 6. Vendor Risk
      new UnverifiedNewVendorRule(),
      new HistoricalVendorFraudRateRule(),

      // 7. Purchase Order 3-Way Match
      new UnlinkedHighValuePORule(),
      new POAmountLimitExceededRule(),
      new POVendorMismatchRule(),

      // 8. Manipulation & Integrity
      new MissingMandatoryHSNSACRule(),
      new MissingMandatoryFieldsRule(),
    ];
  }

  public getAllRules(): { code: string; category: string; name: string; description: string }[] {
    return this.rules.map((r) => ({
      code: r.code,
      category: r.category,
      name: r.name,
      description: r.description,
    }));
  }

  public async evaluate(context: EvaluationContext): Promise<FraudEvaluationResult> {
    const results: RuleResult[] = [];
    let accumulatedScore = 0;

    let passedCount = 0;
    let warningCount = 0;
    let failedCount = 0;
    let criticalCount = 0;

    for (const rule of this.rules) {
      const result = await rule.evaluate(context);
      results.push(result);

      if (result.status === 'PASS') {
        passedCount++;
      } else if (result.status === 'WARNING') {
        warningCount++;
        accumulatedScore += result.scoreContribution;
      } else if (result.status === 'FAIL') {
        failedCount++;
        accumulatedScore += result.scoreContribution;
      } else if (result.status === 'CRITICAL') {
        criticalCount++;
        accumulatedScore += result.scoreContribution;
      }
    }

    // Score strictly capped at 100
    const finalScore = Math.min(100, Math.max(0, accumulatedScore));

    // Risk Classification based on transparent thresholds
    let riskLevel: RiskLevel = 'LOW';
    if (finalScore >= RISK_THRESHOLDS.CRITICAL_MIN) {
      riskLevel = 'CRITICAL';
    } else if (finalScore > RISK_THRESHOLDS.MEDIUM_MAX) {
      riskLevel = 'HIGH';
    } else if (finalScore > RISK_THRESHOLDS.LOW_MAX) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Build human-readable summary explanation
    let summaryExplanation = '';
    const nonPassingRules = results.filter((r) => r.status !== 'PASS');

    if (finalScore === 0) {
      summaryExplanation = 'All 19 Indian GST, duplicate, tax computation, and vendor profile rules passed with zero penalties.';
    } else {
      const triggeredNames = nonPassingRules.map((r) => `${r.ruleName} (+${r.scoreContribution})`).join(', ');
      summaryExplanation = `Evaluated 19 rules. Total Penalty: ${finalScore}/100 [${riskLevel} Risk]. Triggered checks: ${triggeredNames}.`;
    }

    // Determine Alert generation requirement
    const shouldGenerateAlert = finalScore >= 50 || criticalCount > 0;
    let suggestedAlert: FraudEvaluationResult['suggestedAlert'] = undefined;

    if (shouldGenerateAlert) {
      const highestSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
        criticalCount > 0 ? 'CRITICAL' : 'HIGH';

      const topViolations = nonPassingRules
        .sort((a, b) => b.scoreContribution - a.scoreContribution)
        .slice(0, 2);

      const alertTitle =
        highestSeverity === 'CRITICAL'
          ? `CRITICAL RISK: ${topViolations[0]?.ruleName || 'Major Anomaly'}`
          : `HIGH RISK: ${topViolations[0]?.ruleName || 'Validation Discrepancy'}`;

      const alertDescription = `Invoice #${context.invoice.invoiceNumber} scored ${finalScore}/100 risk penalty. Primary indicators: ${topViolations.map((v) => v.details).join(' | ')}`;

      suggestedAlert = {
        type: topViolations[0]?.ruleCode || 'FRAUD_INDICATOR',
        severity: highestSeverity,
        title: alertTitle,
        description: alertDescription,
      };
    }

    return {
      overallScore: finalScore,
      riskLevel,
      passedRulesCount: passedCount,
      warningRulesCount: warningCount,
      failedRulesCount: failedCount,
      criticalRulesCount: criticalCount,
      summaryExplanation,
      ruleResults: results,
      shouldGenerateAlert,
      suggestedAlert,
    };
  }
}

export const fraudEngine = new FraudDetectionEngine();
