import { fraudEngine } from '../engine/detector';
import { EvaluationContext } from '../engine/types';

async function runTests() {
  console.log('🧪 Starting Fraud Detection Engine Verification Suite...\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: Clean Legitimate Invoice (Intra-state Maharashtra)
  // -------------------------------------------------------------
  console.log('--- Test 1: Clean Legitimate Intra-State Invoice ---');
  const cleanContext: EvaluationContext = {
    invoice: {
      invoiceNumber: 'INV/TSL/2024/001',
      vendorId: 'vendor-1',
      invoiceDate: new Date(),
      vendorGstin: '27AAACT2727Q1ZW',
      customerGstin: '27AAACG1234F1Z5',
      placeOfSupply: 'Maharashtra',
      placeOfSupplyStateCode: '27',
      billingAddress: 'Nariman Point, Mumbai',
      taxableAmount: 100000,
      cgstAmount: 9000,
      sgstAmount: 9000,
      igstAmount: 0,
      totalTaxAmount: 18000,
      grandTotal: 118000,
      isInterState: false,
      purchaseOrderId: 'po-1',
    },
    items: [
      {
        itemDescription: 'TMT Steel Bars',
        hsnSac: '7214',
        quantity: 2,
        unitPrice: 50000,
        taxableValue: 100000,
        gstRate: 18,
        cgstAmount: 9000,
        sgstAmount: 9000,
        igstAmount: 0,
        totalAmount: 118000,
      },
    ],
    vendor: {
      id: 'vendor-1',
      name: 'Tata Steel Supplies Ltd',
      legalName: 'Tata Steel Supplies Ltd',
      gstin: '27AAACT2727Q1ZW',
      pan: 'AAACT2727Q',
      state: 'Maharashtra',
      stateCode: '27',
      isVerified: true,
      riskScore: 0,
      totalInvoicesCount: 10,
      totalAmountBilled: 1500000,
      fraudFlagCount: 0,
    },
    purchaseOrder: {
      id: 'po-1',
      poNumber: 'PO-101',
      vendorId: 'vendor-1',
      issueDate: new Date('2024-06-01'),
      totalAmount: 118000,
      status: 'OPEN',
    },
    historicalInvoices: [
      { id: 'h1', invoiceNumber: 'INV/TSL/2024/000', grandTotal: 110000, taxableAmount: 95000, invoiceDate: new Date('2024-05-01'), status: 'VERIFIED', fraudScore: 0 },
      { id: 'h2', invoiceNumber: 'INV/TSL/2024/002', grandTotal: 120000, taxableAmount: 100000, invoiceDate: new Date('2024-05-15'), status: 'VERIFIED', fraudScore: 0 },
      { id: 'h3', invoiceNumber: 'INV/TSL/2024/003', grandTotal: 115000, taxableAmount: 98000, invoiceDate: new Date('2024-05-30'), status: 'VERIFIED', fraudScore: 0 },
    ],
  };

  const res1 = await fraudEngine.evaluate(cleanContext);
  assert(res1.overallScore === 0, 'Clean invoice gets 0 score', `Got: ${res1.overallScore}`);
  assert(res1.riskLevel === 'LOW', 'Clean invoice classified as LOW risk', `Got: ${res1.riskLevel}`);
  assert(res1.criticalRulesCount === 0 && res1.failedRulesCount === 0, 'No failed rules on clean invoice');

  // -------------------------------------------------------------
  // Test 2: Exact Duplicate Invoice Check
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Exact Duplicate Invoice Number ---');
  const duplicateContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      invoiceNumber: 'INV/TSL/2024/000', // Matches h1 in historical
    },
  };

  const res2 = await fraudEngine.evaluate(duplicateContext);
  assert(res2.overallScore >= 35, 'Duplicate invoice score >= 35', `Got: ${res2.overallScore}`);
  const dupRule = res2.ruleResults.find((r) => r.ruleCode === 'DUP-01');
  assert(dupRule?.status === 'CRITICAL', 'DUP-01 status is CRITICAL', `Got: ${dupRule?.status}`);

  // -------------------------------------------------------------
  // Test 3: Invalid Fake GSTIN
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Invalid Fake GSTIN ---');
  const fakeGstinContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      vendorGstin: '07AAAAA0000A1Z5', // Invalid checksum
    },
  };

  const res3 = await fraudEngine.evaluate(fakeGstinContext);
  assert(res3.overallScore >= 30, 'Fake GSTIN score >= 30', `Got: ${res3.overallScore}`);
  const gstinRule = res3.ruleResults.find((r) => r.ruleCode === 'GST-01');
  assert(gstinRule?.status === 'CRITICAL', 'GST-01 status is CRITICAL', `Got: ${gstinRule?.status}`);

  // -------------------------------------------------------------
  // Test 4: Intra-state CGST != SGST Asymmetry
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Intra-State CGST != SGST Asymmetry ---');
  const taxAsymContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      cgstAmount: 12000,
      sgstAmount: 6000, // CGST != SGST
      totalTaxAmount: 18000,
    },
  };

  const res4 = await fraudEngine.evaluate(taxAsymContext);
  const tax3Rule = res4.ruleResults.find((r) => r.ruleCode === 'TAX-03');
  assert(tax3Rule?.status === 'FAIL', 'TAX-03 status is FAIL on asymmetric CGST/SGST', `Got: ${tax3Rule?.status}`);
  assert(tax3Rule?.scoreContribution === 15, 'TAX-03 penalty is 15');

  // -------------------------------------------------------------
  // Test 5: PO Authorized Limit Exceeded (+50%)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: PO Amount Limit Exceeded ---');
  const poOverrunContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      grandTotal: 200000, // PO limit is 118,000 (+69% overrun)
    },
  };

  const res5 = await fraudEngine.evaluate(poOverrunContext);
  const po2Rule = res5.ruleResults.find((r) => r.ruleCode === 'PO-02');
  assert(po2Rule?.status === 'FAIL', 'PO-02 status is FAIL on PO limit exceeded', `Got: ${po2Rule?.status}`);
  assert(po2Rule?.scoreContribution === 25, 'PO-02 penalty is 25');

  // -------------------------------------------------------------
  // Test 6: Vendor Historical Spike (> 3.0x Average)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Vendor Historical Spike ---');
  const spikeContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      grandTotal: 500000, // Mean is ~115k -> 4.3x spike
    },
  };

  const res6 = await fraudEngine.evaluate(spikeContext);
  const spikeRule = res6.ruleResults.find((r) => r.ruleCode === 'ANO-01');
  assert(spikeRule?.status === 'FAIL', 'ANO-01 status is FAIL on >3x spike', `Got: ${spikeRule?.status}`);
  assert(spikeRule?.scoreContribution === 20, 'ANO-01 penalty is 20');

  // -------------------------------------------------------------
  // Test 7: Future Dated Invoice
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Future Dated Invoice ---');
  const futureContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      invoiceDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 days future
    },
  };

  const res7 = await fraudEngine.evaluate(futureContext);
  const dateRule = res7.ruleResults.find((r) => r.ruleCode === 'DAT-01');
  assert(dateRule?.status === 'CRITICAL', 'DAT-01 status is CRITICAL on future date', `Got: ${dateRule?.status}`);

  // -------------------------------------------------------------
  // Test 8: Stale Invoice (> 180 Days) Low Severity Review
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Stale Invoice (> 180 Days) Low Severity ---');
  const staleContext: EvaluationContext = {
    ...cleanContext,
    invoice: {
      ...cleanContext.invoice,
      invoiceDate: new Date('2023-01-01'), // > 180 days old
    },
  };

  const res8 = await fraudEngine.evaluate(staleContext);
  const staleRule = res8.ruleResults.find((r) => r.ruleCode === 'DAT-02');
  assert(staleRule?.status === 'WARNING', 'DAT-02 status is WARNING', `Got: ${staleRule?.status}`);
  assert(staleRule?.scoreContribution === 5, 'DAT-02 penalty is 5 (low severity)');

  console.log(`\n====================================================`);
  console.log(`📊 Suite Completed: ${passedTests}/${totalTests} tests passed.`);
  console.log(`====================================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
